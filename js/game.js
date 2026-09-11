(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};
  const U = CN.Utils;

  const MAX_LOGS = 200;
  const MAX_IMPORT_BYTES = 500 * 1024;
  const MAX_WORD_LENGTH = 40;
  const listeners = new Set();
  let transitionLock = false;

  // V10: one unique reveal image is assigned to every board card for the whole round.
  // V10: تُسند صورة كشف فريدة لكل بطاقة طوال الجولة، ويعاد خلط الصور عند كل جولة جديدة.
  const REVEAL_CARD_IMAGES = Object.freeze([
    'assets/cards/card-01.webp', 'assets/cards/card-02.webp', 'assets/cards/card-03.webp', 'assets/cards/card-04.webp', 'assets/cards/card-05.webp',
    'assets/cards/card-06.webp', 'assets/cards/card-07.webp', 'assets/cards/card-08.webp', 'assets/cards/card-09.webp', 'assets/cards/card-10.webp',
    'assets/cards/card-11.webp', 'assets/cards/card-12.webp', 'assets/cards/card-13.webp', 'assets/cards/card-14.webp', 'assets/cards/card-15.webp',
    'assets/cards/card-16.webp', 'assets/cards/card-17.webp', 'assets/cards/card-18.webp', 'assets/cards/card-19.webp', 'assets/cards/card-20.webp',
    'assets/cards/card-21.webp', 'assets/cards/card-22.webp', 'assets/cards/card-23.webp', 'assets/cards/card-24.webp', 'assets/cards/card-25.webp'
  ]);

  const DEFAULT_SETTINGS = Object.freeze({
    uiLanguage: 'ar',
    cardLanguage: 'both',
    strictClues: true,
    expertRules: false,
    wordSource: 'default'
  });

  function blankState(settings) {
    return {
      status: 'setup',
      players: [],
      teams: { red: { spymasterId: null, operativeIds: [] }, blue: { spymasterId: null, operativeIds: [] }, spectatorIds: [] },
      startingTeam: null,
      currentTeam: null,
      board: [],
      remaining: { red: 0, blue: 0 },
      currentClue: null,
      guessesMade: 0,
      maxGuesses: 0,
      winner: null,
      endReason: null,
      settings: Object.assign({}, DEFAULT_SETTINGS, settings || {}),
      logs: [],
      errorLogs: [],
      clueChallenge: null,
      invalidCluePenalty: null,
      createdAt: null,
      roundId: null
    };
  }

  let gameState = blankState();

  function nowISO() { return new Date().toISOString(); }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(gameState); } catch (error) { logError(error, { source: 'subscriber' }, false); }
    });
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function noop() {};
    listeners.add(fn);
    return function unsubscribe() { listeners.delete(fn); };
  }

  function trimLogs(list) {
    if (list.length > MAX_LOGS) list.splice(0, list.length - MAX_LOGS);
  }

  function logEvent(type, payload, shouldNotify) {
    gameState.logs.push({ timestamp: nowISO(), level: 'info', type, payload: payload || {} });
    trimLogs(gameState.logs);
    if (shouldNotify) notify();
  }

  function logError(error, context, shouldNotify) {
    const entry = {
      timestamp: nowISO(),
      level: 'error',
      code: context && context.code ? context.code : 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: context || {}
    };
    gameState.errorLogs.push(entry);
    trimLogs(gameState.errorLogs);
    if (shouldNotify) notify();
    return entry;
  }

  function warning(code, message, context) {
    const entry = { timestamp: nowISO(), level: 'warning', code, message, context: context || {} };
    gameState.errorLogs.push(entry);
    trimLogs(gameState.errorLogs);
    return entry;
  }

  function getState() { return gameState; }
  function getSnapshot() { return U.deepClone(gameState); }

  /**
   * Replaces the local state with a trusted synchronized snapshot.
   * يستبدل الحالة المحلية بنسخة موثوقة متزامنة من الغرفة.
   */
  function replaceState(nextState, shouldNotify) {
    if (!nextState || typeof nextState !== 'object') return { ok: false, code: 'INVALID_STATE' };
    gameState = U.deepClone(nextState);
    // V7 no longer uses candidate-card state. Ignore legacy room snapshots safely.
    // V7 أزال حالة البطاقات المحتملة؛ نتجاهلها عند فتح غرفة قديمة.
    if (Object.prototype.hasOwnProperty.call(gameState, 'candidateSelection')) delete gameState.candidateSelection;
    if (!Array.isArray(gameState.logs)) gameState.logs = gameState.logs && typeof gameState.logs === 'object' ? Object.values(gameState.logs) : [];
    if (!Array.isArray(gameState.errorLogs)) gameState.errorLogs = gameState.errorLogs && typeof gameState.errorLogs === 'object' ? Object.values(gameState.errorLogs) : [];
    if (gameState.maxGuesses === null && gameState.currentClue && ['unlimited', 'zero'].includes(gameState.currentClue.mode)) {
      gameState.maxGuesses = Infinity;
    }
    transitionLock = false;
    if (shouldNotify !== false) notify();
    return { ok: true, state: gameState };
  }

  /**
   * Returns a snapshot safe to publish to ordinary room members.
   * يعيد نسخة عامة لا تكشف أدوار البطاقات غير المكشوفة.
   */
  function getPublicSnapshot() {
    const snapshot = getSnapshot();
    snapshot.maxGuesses = Number.isFinite(snapshot.maxGuesses) ? snapshot.maxGuesses : null;
    snapshot.board = snapshot.board.map((card) => {
      const publicCard = Object.assign({}, card);
      if (!card.revealed && snapshot.status !== 'ended') publicCard.role = null;
      return publicCard;
    });
    return snapshot;
  }

  /**
   * Secret role map is stored separately online.
   * خريطة الأدوار السرية تحفظ في مسار منفصل عند اللعب أونلاين.
   */
  function getSecretRoleMap() {
    const map = {};
    gameState.board.forEach((card) => { if (card && card.id && card.role) map[card.id] = card.role; });
    return map;
  }

  function applySecretRoles(snapshot, roleMap) {
    const next = U.deepClone(snapshot || {});
    if (!Array.isArray(next.board) || !roleMap) return next;
    next.board = next.board.map((card) => Object.assign({}, card, { role: roleMap[card.id] || card.role || null }));
    if (next.maxGuesses === null && next.currentClue && ['unlimited', 'zero'].includes(next.currentClue.mode)) next.maxGuesses = Infinity;
    return next;
  }

  /**
   * Creates the exact classic role distribution and shuffles it.
   * ينشئ توزيع الأدوار الكلاسيكي 9/8/7/1 ثم يخلطه.
   */
  function assignRoles(startingTeam) {
    if (startingTeam !== 'red' && startingTeam !== 'blue') throw new Error('startingTeam must be red or blue');
    const other = U.oppositeTeam(startingTeam);
    return U.shuffle([
      ...Array(9).fill(startingTeam),
      ...Array(8).fill(other),
      ...Array(7).fill('neutral'),
      'assassin'
    ]);
  }

  function sanitizeWordEntry(entry, index) {
    if (!entry || typeof entry !== 'object') return { valid: false, reason: 'NOT_OBJECT' };
    const ar = U.normalizeWhitespace(entry.ar || '');
    const en = U.normalizeWhitespace(entry.en || '');
    if (!ar || !en) return { valid: false, reason: 'MISSING_LANGUAGE' };
    if (ar.length > MAX_WORD_LENGTH || en.length > MAX_WORD_LENGTH) return { valid: false, reason: 'WORD_TOO_LONG' };
    const rawId = U.normalizeLatin(entry.id || '') || `custom-${U.simpleHash(`${ar}|${en}|${index}`)}`;
    const id = rawId.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `custom-${index}`;
    return { valid: true, word: { id, ar, en } };
  }

  function validateWordPool(words) {
    if (!Array.isArray(words)) return { valid: false, words: [], rejected: [{ index: -1, reason: 'NOT_ARRAY' }], errors: ['NOT_ARRAY'] };
    const accepted = [];
    const rejected = [];
    const ids = new Set();
    const arabic = new Set();
    const english = new Set();

    words.forEach((entry, index) => {
      const checked = sanitizeWordEntry(entry, index);
      if (!checked.valid) {
        rejected.push({ index, reason: checked.reason });
        return;
      }
      const word = checked.word;
      const arKey = U.normalizeArabic(word.ar);
      const enKey = U.normalizeLatin(word.en);
      const idKey = U.normalizeLatin(word.id);
      if (ids.has(idKey) || arabic.has(arKey) || english.has(enKey)) {
        rejected.push({ index, reason: 'DUPLICATE', word });
        return;
      }
      ids.add(idKey); arabic.add(arKey); english.add(enKey);
      accepted.push(word);
    });

    const errors = [];
    if (accepted.length < 25) errors.push('NEED_25_WORDS');
    return { valid: accepted.length >= 25, words: accepted, acceptedCount: accepted.length, rejectedCount: rejected.length, rejected, errors };
  }

  function createBoard(wordPool, startingTeam) {
    const validation = validateWordPool(wordPool);
    if (!validation.valid) throw new Error('Word pool must contain at least 25 unique valid bilingual words');
    const chosen = U.shuffle(validation.words).slice(0, 25);
    const team = startingTeam || gameState.startingTeam || (U.randomInt(2) === 0 ? 'red' : 'blue');
    const roles = assignRoles(team);
    const revealImages = U.shuffle(REVEAL_CARD_IMAGES);
    return chosen.map((word, index) => ({
      id: `card-${index}-${word.id}`,
      wordId: word.id,
      ar: word.ar,
      en: word.en,
      role: roles[index],
      revealImage: revealImages[index],
      revealed: false,
      revealedBy: null,
      revealedAt: null
    }));
  }

  function buildTeams(players) {
    const teams = { red: { spymasterId: null, operativeIds: [] }, blue: { spymasterId: null, operativeIds: [] }, spectatorIds: [] };
    players.forEach((p) => {
      if (p.team === 'spectator' || p.role === 'spectator') { teams.spectatorIds.push(p.id); return; }
      if (!teams[p.team]) return;
      if (p.role === 'spymaster') teams[p.team].spymasterId = p.id;
      else teams[p.team].operativeIds.push(p.id);
    });
    return teams;
  }

  function validatePlayers(players) {
    const errors = [];
    const clean = (players || []).map((p, i) => {
      const spectator = p && (p.team === 'spectator' || p.role === 'spectator');
      return {
        id: p.id || `player-${i + 1}`,
        name: U.normalizeWhitespace(p.name || `Player ${i + 1}`),
        team: spectator ? 'spectator' : p.team,
        role: spectator ? 'spectator' : p.role
      };
    });
    const active = clean.filter((p) => p.team === 'red' || p.team === 'blue');
    if (!Array.isArray(players) || active.length < 4) errors.push('MIN_4_ACTIVE_PLAYERS');
    ['red', 'blue'].forEach((team) => {
      const members = active.filter((p) => p.team === team);
      if (members.length < 2) errors.push(`${team.toUpperCase()}_MIN_2`);
      if (members.filter((p) => p.role === 'spymaster').length !== 1) errors.push(`${team.toUpperCase()}_ONE_SPYMASTER`);
      if (members.filter((p) => p.role === 'operative').length < 1) errors.push(`${team.toUpperCase()}_NEED_OPERATIVE`);
    });
    if (clean.some((p) => !['red', 'blue', 'spectator'].includes(p.team))) errors.push('INVALID_TEAM');
    if (clean.some((p) => !['spymaster', 'operative', 'spectator'].includes(p.role))) errors.push('INVALID_ROLE');
    if (clean.some((p) => (p.team === 'spectator') !== (p.role === 'spectator'))) errors.push('SPECTATOR_ROLE_MISMATCH');
    return { valid: errors.length === 0, players: clean, errors };
  }

  function startGame(options) {
    const opts = options || {};
    const playerCheck = validatePlayers(opts.players || []);
    if (!playerCheck.valid) return { ok: false, code: 'INVALID_PLAYERS', errors: playerCheck.errors };
    const wordCheck = validateWordPool(opts.wordPool || CN.DEFAULT_WORDS || []);
    if (!wordCheck.valid) return { ok: false, code: 'INVALID_WORD_POOL', errors: wordCheck.errors };

    const settings = Object.assign({}, DEFAULT_SETTINGS, opts.settings || {});
    gameState = blankState(settings);
    gameState.players = playerCheck.players;
    gameState.teams = buildTeams(playerCheck.players);
    gameState.startingTeam = opts.startingTeam === 'red' || opts.startingTeam === 'blue' ? opts.startingTeam : (U.randomInt(2) === 0 ? 'red' : 'blue');
    gameState.currentTeam = gameState.startingTeam;
    gameState.board = createBoard(wordCheck.words, gameState.startingTeam);
    gameState.remaining.red = gameState.board.filter((c) => c.role === 'red').length;
    gameState.remaining.blue = gameState.board.filter((c) => c.role === 'blue').length;
    gameState.status = 'clue';
    gameState.createdAt = nowISO();
    gameState.roundId = `round-${Date.now()}-${U.randomInt(1000000)}`;
    logEvent('GAME_STARTED', { startingTeam: gameState.startingTeam, players: gameState.players.length, activePlayers: gameState.players.filter((p) => p.team === 'red' || p.team === 'blue').length, spectators: gameState.players.filter((p) => p.role === 'spectator').length, wordSource: settings.wordSource });
    logEvent('TURN_STARTED', { team: gameState.startingTeam, initial: true });
    notify();
    return { ok: true, state: gameState };
  }

  function visibleBoardWords() {
    return gameState.board.filter((c) => !c.revealed);
  }

  function validateClue(text, numberOrMode, language) {
    const clue = U.normalizeWhitespace(text || '');
    const result = { valid: true, clue, errors: [], warnings: [] };
    if (!clue) {
      result.valid = false; result.errors.push('EMPTY_CLUE'); return result;
    }
    if (gameState.settings.strictClues && /\s/.test(clue)) {
      result.valid = false; result.errors.push('MULTI_WORD_CLUE');
    }

    const mode = numberOrMode === 'unlimited' || numberOrMode === 'zero' ? numberOrMode : 'number';
    if (mode === 'number') {
      const n = Number(numberOrMode);
      if (!Number.isInteger(n) || n <= 0) { result.valid = false; result.errors.push('INVALID_NUMBER'); }
    } else if (!gameState.settings.expertRules) {
      result.valid = false; result.errors.push('EXPERT_RULES_DISABLED');
    }

    const clueAr = U.normalizeArabic(clue);
    const clueEn = U.normalizeLatin(clue);
    const exact = visibleBoardWords().find((card) => U.normalizeArabic(card.ar) === clueAr || U.normalizeLatin(card.en) === clueEn);
    if (exact) {
      result.valid = false;
      result.errors.push('CLUE_MATCHES_VISIBLE_WORD');
      result.matchCardId = exact.id;
    }
    result.language = language || gameState.settings.uiLanguage;
    return result;
  }

  function startTurn(team) {
    if (gameState.status === 'ended') return { ok: false, code: 'GAME_ENDED' };
    if (!['red', 'blue'].includes(team)) return { ok: false, code: 'INVALID_TEAM' };
    gameState.currentTeam = team;
    gameState.status = 'clue';
    gameState.currentClue = null;
    gameState.guessesMade = 0;
    gameState.maxGuesses = 0;
    gameState.clueChallenge = null;
    gameState.invalidCluePenalty = null;
    logEvent('TURN_STARTED', { team });
    notify();
    return { ok: true };
  }

  function submitClue(input) {
    if (gameState.status !== 'clue') return { ok: false, code: 'INVALID_PHASE' };
    const clue = input || {};
    const mode = clue.mode || 'number';
    const checkValue = mode === 'number' ? Number(clue.number) : mode;
    const validation = validateClue(clue.text, checkValue, gameState.settings.uiLanguage);
    if (!validation.valid) return { ok: false, code: 'INVALID_CLUE', validation };

    let maxGuesses;
    if (mode === 'number') maxGuesses = Number(clue.number) + 1;
    else maxGuesses = Infinity;

    gameState.currentClue = {
      text: validation.clue,
      mode,
      number: mode === 'number' ? Number(clue.number) : (mode === 'zero' ? 0 : null),
      submittedByTeam: gameState.currentTeam,
      submittedAt: nowISO()
    };
    gameState.guessesMade = 0;
    gameState.maxGuesses = maxGuesses;
    gameState.status = 'guessing';
    gameState.clueChallenge = { status: 'open', challengedBy: U.oppositeTeam(gameState.currentTeam) };
    logEvent('CLUE_SUBMITTED', { team: gameState.currentTeam, text: validation.clue, mode, number: gameState.currentClue.number });
    notify();
    return { ok: true, clue: gameState.currentClue, maxGuesses };
  }

  function challengeClue() {
    if (gameState.status !== 'guessing' || !gameState.currentClue || gameState.guessesMade > 0 || !gameState.clueChallenge || gameState.clueChallenge.status !== 'open') return { ok: false, code: 'CHALLENGE_NOT_AVAILABLE' };
    gameState.clueChallenge = { status: 'pending', challengedBy: U.oppositeTeam(gameState.currentTeam), challengedAt: nowISO() };
    logEvent('CLUE_CHALLENGED', { byTeam: gameState.clueChallenge.challengedBy });
    notify();
    return { ok: true };
  }

  function resolveClueChallenge(decision) {
    if (!gameState.clueChallenge || gameState.clueChallenge.status !== 'pending') return { ok: false, code: 'NO_PENDING_CHALLENGE' };
    const opponent = U.oppositeTeam(gameState.currentTeam);
    if (decision === 'allow') {
      gameState.clueChallenge = { status: 'allowed', challengedBy: opponent, resolvedAt: nowISO() };
      logEvent('CLUE_ALLOWED', { byTeam: opponent });
      notify();
      return { ok: true, allowed: true };
    }
    if (decision === 'reject') {
      gameState.clueChallenge = { status: 'rejected', challengedBy: opponent, resolvedAt: nowISO() };
      gameState.status = 'penalty';
      gameState.invalidCluePenalty = { team: opponent, pending: true, createdAt: nowISO() };
      gameState.currentClue = null;
      gameState.guessesMade = 0;
      gameState.maxGuesses = 0;
      logEvent('CLUE_REJECTED', { offender: gameState.currentTeam, penaltyTeam: opponent });
      notify();
      return { ok: true, allowed: false, penaltyTeam: opponent };
    }
    return { ok: false, code: 'INVALID_DECISION' };
  }

  /**
   * Ends the game exactly once.
   * ينهي اللعبة مرة واحدة فقط ويمنع تغيير النتيجة لاحقاً.
   */
  function endGame(winnerTeam, reason) {
    if (gameState.status === 'ended') {
      if (gameState.winner !== winnerTeam) warning('ENDGAME_ALREADY_SET', 'Attempted to overwrite an existing winner.', { existing: gameState.winner, attempted: winnerTeam, reason });
      return { ok: false, code: 'ALREADY_ENDED', winner: gameState.winner };
    }
    gameState.status = 'ended';
    gameState.winner = winnerTeam;
    gameState.endReason = reason;
    gameState.currentClue = null;
    gameState.invalidCluePenalty = null;
    logEvent('GAME_ENDED', { winner: winnerTeam, reason });
    notify();
    return { ok: true, winner: winnerTeam, reason };
  }

  function checkWinCondition() {
    if (gameState.status === 'ended') return gameState.winner;
    if (gameState.remaining.red === 0) { endGame('red', 'ALL_AGENTS_FOUND'); return 'red'; }
    if (gameState.remaining.blue === 0) { endGame('blue', 'ALL_AGENTS_FOUND'); return 'blue'; }
    return null;
  }

  /**
   * Reveals a card once and resolves assassin/win before any turn switch.
   * يكشف البطاقة مرة واحدة ويفحص القاتل والفوز قبل تبديل الدور.
   */
  function revealCard(cardId, guessingTeam, source) {
    const card = gameState.board.find((item) => item.id === cardId);
    if (!card) return { ok: false, code: 'CARD_NOT_FOUND' };
    if (card.revealed) return { ok: false, code: 'ALREADY_REVEALED', card };
    if (gameState.status === 'ended') return { ok: false, code: 'GAME_ENDED' };

    card.revealed = true;
    card.revealedBy = source || guessingTeam || null;
    card.revealedAt = nowISO();

    if (card.role === 'red' || card.role === 'blue') {
      gameState.remaining[card.role] = Math.max(0, gameState.remaining[card.role] - 1);
    }

    const outcome = card.role === 'assassin' ? 'assassin' : card.role === 'neutral' ? 'neutral' : (guessingTeam && card.role === guessingTeam ? 'correct' : (guessingTeam ? 'opponent' : 'penalty'));
    logEvent('CARD_REVEALED', { cardId: card.id, wordId: card.wordId, ar: card.ar, en: card.en, role: card.role, outcome, guessingTeam, source: source || 'guess', clue: gameState.currentClue ? U.deepClone(gameState.currentClue) : null, remaining: U.deepClone(gameState.remaining) });

    if (card.role === 'assassin') {
      const loser = guessingTeam || gameState.currentTeam;
      const winner = U.oppositeTeam(loser);
      endGame(winner, 'ASSASSIN');
      return { ok: true, card, role: card.role, ended: true, winner };
    }

    if ((card.role === 'red' || card.role === 'blue') && gameState.remaining[card.role] === 0) {
      endGame(card.role, 'ALL_AGENTS_FOUND');
      return { ok: true, card, role: card.role, ended: true, winner: card.role };
    }

    return { ok: true, card, role: card.role, ended: false };
  }

  function endTurn(reason, options) {
    const opts = options || {};
    if (gameState.status === 'ended') return { ok: false, code: 'GAME_ENDED' };
    if (gameState.status !== 'guessing' && !opts.force) return { ok: false, code: 'INVALID_PHASE' };
    // Preserve V2 classic rule: at least one guess is required before a voluntary end turn.
    // نحافظ على قاعدة V2: يجب إجراء تخمين واحد على الأقل قبل إنهاء الدور اختيارياً.
    if (gameState.status === 'guessing' && gameState.guessesMade < 1 && !opts.force) return { ok: false, code: 'MUST_GUESS_FIRST' };
    const endingTeam = gameState.currentTeam;
    const nextTeam = U.oppositeTeam(endingTeam);
    const endingClue = gameState.currentClue ? U.deepClone(gameState.currentClue) : null;
    const endingGuesses = gameState.guessesMade;
    gameState.currentClue = null;
    gameState.guessesMade = 0;
    gameState.maxGuesses = 0;
    gameState.clueChallenge = null;
    gameState.invalidCluePenalty = null;
    gameState.currentTeam = nextTeam;
    gameState.status = 'clue';
    logEvent('TURN_ENDED', { team: endingTeam, nextTeam, reason: reason || 'VOLUNTARY', clue: endingClue, guessesMade: endingGuesses });
    logEvent('TURN_STARTED', { team: nextTeam, previousTeam: endingTeam });
    notify();
    return { ok: true, nextTeam };
  }

  function handleGuess(cardId) {
    if (transitionLock) return { ok: false, code: 'BUSY' };
    if (gameState.status !== 'guessing') return { ok: false, code: 'INVALID_PHASE' };
    if (gameState.clueChallenge && gameState.clueChallenge.status === 'pending') return { ok: false, code: 'CHALLENGE_PENDING' };
    const card = gameState.board.find((item) => item.id === cardId);
    if (!card || card.revealed) return { ok: false, code: card ? 'ALREADY_REVEALED' : 'CARD_NOT_FOUND' };

    transitionLock = true;
    try {
      gameState.guessesMade += 1;
      const guessingTeam = gameState.currentTeam;
      const result = revealCard(cardId, guessingTeam, 'guess');
      if (!result.ok || gameState.status === 'ended') { notify(); return result; }

      if (result.role === 'neutral') {
        return endTurn('NEUTRAL_GUESS', { force: true });
      }
      if (result.role !== guessingTeam) {
        return endTurn('OPPONENT_AGENT', { force: true });
      }
      if (Number.isFinite(gameState.maxGuesses) && gameState.guessesMade >= gameState.maxGuesses) {
        return endTurn('GUESS_LIMIT_REACHED', { force: true });
      }
      logEvent('CORRECT_GUESS', { team: guessingTeam, guessesMade: gameState.guessesMade });
      notify();
      return { ok: true, card: result.card, continue: true };
    } finally {
      transitionLock = false;
    }
  }

  function getPenaltyCandidates() {
    if (gameState.status !== 'penalty' || !gameState.invalidCluePenalty || !gameState.invalidCluePenalty.pending) return [];
    const team = gameState.invalidCluePenalty.team;
    return gameState.board.filter((card) => !card.revealed && card.role === team);
  }

  function resolveInvalidCluePenalty(cardId) {
    if (gameState.status !== 'penalty' || !gameState.invalidCluePenalty || !gameState.invalidCluePenalty.pending) return { ok: false, code: 'NO_PENALTY_PENDING' };
    const penaltyTeam = gameState.invalidCluePenalty.team;
    if (cardId) {
      const card = gameState.board.find((item) => item.id === cardId);
      if (!card || card.revealed || card.role !== penaltyTeam) return { ok: false, code: 'INVALID_PENALTY_CARD' };
      const reveal = revealCard(cardId, null, 'invalid-clue-penalty');
      if (!reveal.ok) return reveal;
      if (gameState.status === 'ended') return reveal;
    }
    gameState.invalidCluePenalty.pending = false;
    logEvent('INVALID_CLUE_PENALTY_RESOLVED', { team: penaltyTeam, cardId: cardId || null });
    return startTurn(penaltyTeam);
  }

  function splitCSVLine(line) {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
        else quoted = !quoted;
      } else if (char === ',' && !quoted) {
        cells.push(current.trim()); current = '';
      } else current += char;
    }
    cells.push(current.trim());
    return cells;
  }

  function detectImportType(raw, type) {
    if (type && type !== 'auto') return type;
    const text = U.normalizeWhitespace(raw).slice(0, 100);
    if (text.startsWith('[') || text.startsWith('{')) return 'json';
    if (/^ar\s*,\s*en/i.test(text) || (String(raw).includes(',') && !String(raw).includes('|'))) return 'csv';
    return 'txt';
  }

  function importCustomWords(rawInput, type) {
    const raw = String(rawInput == null ? '' : rawInput);
    if (new Blob([raw]).size > MAX_IMPORT_BYTES) return { valid: false, words: [], acceptedCount: 0, rejectedCount: 1, errors: ['FILE_TOO_LARGE'], rejected: [] };
    const format = detectImportType(raw, type);
    let entries = [];
    const parserRejected = [];
    try {
      if (format === 'json') {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('JSON must be an array');
        entries = data.map((item) => ({ ar: item && item.ar, en: item && item.en, id: item && item.id }));
      } else if (format === 'csv') {
        const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
        if (lines.length && /^\s*ar\s*,\s*en\s*$/i.test(lines[0].trim())) lines.shift();
        entries = lines.map((line, index) => {
          const cells = splitCSVLine(line);
          if (cells.length < 2) parserRejected.push({ index, reason: 'MALFORMED_CSV' });
          return { ar: cells[0] || '', en: cells[1] || '' };
        });
      } else {
        const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
        entries = lines.map((line, index) => {
          const splitAt = line.indexOf('|');
          if (splitAt < 0) { parserRejected.push({ index, reason: 'MALFORMED_TXT' }); return { ar: '', en: '' }; }
          return { ar: line.slice(0, splitAt), en: line.slice(splitAt + 1) };
        });
      }
    } catch (error) {
      return { valid: false, format, words: [], acceptedCount: 0, rejectedCount: 1, errors: ['PARSE_ERROR'], rejected: [{ index: -1, reason: error.message }] };
    }
    const checked = validateWordPool(entries);
    return {
      valid: checked.valid,
      format,
      words: checked.words,
      acceptedCount: checked.acceptedCount,
      rejectedCount: checked.rejectedCount + parserRejected.length,
      errors: checked.errors,
      rejected: parserRejected.concat(checked.rejected)
    };
  }

  function resetGame(options) {
    const opts = options || {};
    if (gameState.status === 'setup') return { ok: false, code: 'NO_ACTIVE_GAME' };
    const preserved = {
      players: U.deepClone(gameState.players),
      settings: Object.assign({}, gameState.settings),
      wordPool: opts.wordPool || (gameState.settings.wordSource === 'custom' && opts.customWords ? opts.customWords : CN.DEFAULT_WORDS),
      startingTeam: opts.startingTeam
    };
    transitionLock = false;
    return startGame(preserved);
  }

  function newGameToSetup() {
    const settings = Object.assign({}, gameState.settings);
    gameState = blankState(settings);
    transitionLock = false;
    notify();
    return { ok: true };
  }

  function updateSettings(patch) {
    const next = patch || {};
    const allowed = ['uiLanguage', 'cardLanguage', 'strictClues', 'expertRules', 'wordSource'];
    Object.keys(next).forEach((key) => {
      if (!allowed.includes(key)) return;
      if (key === 'cardLanguage' && !['setup', 'ended'].includes(gameState.status) && next[key] !== gameState.settings.cardLanguage) return;
      gameState.settings[key] = next[key];
    });
    notify();
    return { ok: true, settings: gameState.settings };
  }

  function clearLogs(which) {
    if (which === 'errors') gameState.errorLogs = [];
    else if (which === 'game') gameState.logs = [];
    else { gameState.logs = []; gameState.errorLogs = []; }
    notify();
  }

  function randomiseTeams(players) {
    const source = players.map((p) => Object.assign({}, p));
    const spectators = source.filter((p) => p.team === 'spectator' || p.role === 'spectator').map((p) => Object.assign(p, { team: 'spectator', role: 'spectator' }));
    const active = U.shuffle(source.filter((p) => p.team !== 'spectator' && p.role !== 'spectator'));
    active.forEach((p, index) => { p.team = index % 2 === 0 ? 'red' : 'blue'; p.role = 'operative'; });
    return active.concat(spectators);
  }

  function randomiseSpymasters(players) {
    const next = players.map((p) => {
      const spectator = p.team === 'spectator' || p.role === 'spectator';
      return Object.assign({}, p, spectator ? { team: 'spectator', role: 'spectator' } : { role: 'operative' });
    });
    ['red', 'blue'].forEach((team) => {
      const members = next.filter((p) => p.team === team);
      if (members.length) members[U.randomInt(members.length)].role = 'spymaster';
    });
    return next;
  }

  CN.Game = {
    DEFAULT_SETTINGS,
    REVEAL_CARD_IMAGES,
    MAX_IMPORT_BYTES,
    MAX_WORD_LENGTH,
    getState,
    getSnapshot,
    replaceState,
    getPublicSnapshot,
    getSecretRoleMap,
    applySecretRoles,
    subscribe,
    assignRoles,
    createBoard,
    validateWordPool,
    validatePlayers,
    validateClue,
    startGame,
    startTurn,
    submitClue,
    challengeClue,
    resolveClueChallenge,
    revealCard,
    handleGuess,
    checkWinCondition,
    endTurn,
    endGame,
    resetGame,
    newGameToSetup,
    importCustomWords,
    getPenaltyCandidates,
    resolveInvalidCluePenalty,
    logEvent,
    logError,
    clearLogs,
    updateSettings,
    randomiseTeams,
    randomiseSpymasters,
    __test: {
      replaceState(nextState) { replaceState(nextState, false); },
      blankState,
      setTransitionLock(value) { transitionLock = Boolean(value); }
    }
  };
})(window);
