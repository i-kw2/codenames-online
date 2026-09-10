(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};
  const G = CN.Game;
  const I = CN.I18n;
  const U = CN.Utils;

  const refs = {};
  let setupPlayers = [
    { id: 'player-1', name: 'Player 1', team: 'red', role: 'spymaster' },
    { id: 'player-2', name: 'Player 2', team: 'red', role: 'operative' },
    { id: 'player-3', name: 'Player 3', team: 'blue', role: 'spymaster' },
    { id: 'player-4', name: 'Player 4', team: 'blue', role: 'operative' }
  ];
  let playerSequence = 5;
  let customWords = null;
  let currentLogType = 'game';
  let viewMode = 'operative';
  let holdTimer = null;
  let holdStart = 0;
  let holdAnimation = null;
  let toastTimer = null;
  let runtimeMode = 'menu'; // menu | local | online
  let onlineContext = { inRoom: false, roomStatus: null, isHost: false, uid: null, player: null, secretReady: false };
  let guessBusy = false;


  function cacheRefs() {
    [
      'uiLanguageGlobal','soundToggleBtn','soundVolume','onlineHomeSection','lobbySection','playLocalBtn','setupSection','gameSection','addPlayerBtn','randomTeamsBtn','randomSpiesBtn','playersContainer',
      'cardLanguageSelect','wordSourceSelect','strictCluesCheckbox','expertRulesCheckbox','manageWordsBtn','customWordsStatus','setupMessage','startGameBtn',
      'currentTeamValue','startingTeamValue','redRemaining','blueRemaining','phaseValue','viewModeLabel','secretWarning','board','teamRosterPanel','redRoster','blueRoster','spectatorRoster',
      'currentClueValue','guessCounter','expertHint','spymasterControls','clueForm','clueTextInput','clueModeSelect','clueNumberField','clueNumberInput','clueValidationMessage',
      'penaltyPanel','penaltyCandidates','skipPenaltyBtn','spymasterKeyBtn','hideSpymasterBtn','challengeClueBtn','endTurnBtn','actionMessage','winnerPanel','winnerValue','winnerReason',
      'gameLogBtn','errorLogBtn','resetGameBtn','newGameBtn','privacyDialog','holdRevealBtn','holdProgress','challengeDialog','challengeClueText','allowClueBtn','rejectClueBtn',
      'logsDialog','logsTitle','closeLogsBtn','logsContent','copyLogsBtn','downloadLogsBtn','clearLogsBtn','wordsDialog','closeWordsBtn','wordFormatSelect','wordFileInput','wordTextarea',
      'wordImportResult','importWordsBtn','revertWordsBtn','toast'
    ].forEach((id) => { refs[id] = document.getElementById(id); });
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      if (key) element.textContent = I.t(key);
    });
    refs.uiLanguageGlobal.value = I.getLanguage();
    document.title = I.t('appTitle');
  }

  function teamLabel(team) { if (team === 'spectator') return I.t('spectator'); return I.t(team === 'blue' ? 'blue' : 'red'); }
  function roleLabel(role) { if (role === 'spectator') return I.t('spectator'); return I.t(role === 'spymaster' ? 'spymaster' : 'operative'); }

  function isOnline() { return runtimeMode === 'online'; }
  function myOnlinePlayer() { return onlineContext && onlineContext.player ? onlineContext.player : null; }
  function canUseSpymasterView() {
    if (!isOnline()) return true;
    const player = myOnlinePlayer();
    return Boolean(player && player.role === 'spymaster' && onlineContext.secretReady);
  }

  function setRuntimeMode(mode) {
    runtimeMode = ['menu', 'local', 'online'].includes(mode) ? mode : 'menu';
    render(G.getState());
  }

  function setOnlineContext(next) {
    onlineContext = Object.assign({}, onlineContext, next || {});
    runtimeMode = 'online';
    if (!canUseSpymasterView()) viewMode = 'operative';
    render(G.getState());
  }

  function showLocalSetup() {
    runtimeMode = 'local';
    onlineContext = { inRoom: false, roomStatus: null, isHost: false, uid: null, player: null, secretReady: false };
    if (G.getState().status !== 'setup') G.newGameToSetup();
    render(G.getState());
  }

  async function requestOnlineAction(type, payload) {
    if (!CN.Online || typeof CN.Online.requestAction !== 'function') return { ok: false, code: 'ONLINE_NOT_READY' };
    try { return await CN.Online.requestAction(type, payload || {}); }
    catch (error) { G.logError(error, { code: 'ONLINE_ACTION_UI', type }, true); return { ok: false, code: error.code || error.message || 'ONLINE_ERROR' }; }
  }

  function phaseLabel(status) {
    if (status === 'guessing') return I.t('phaseGuessing');
    if (status === 'ended') return I.t('phaseEnded');
    if (status === 'penalty') return I.t('phasePenalty');
    return I.t('phaseClue');
  }

  function setMessage(element, text, kind) {
    if (!text) { element.hidden = true; element.textContent = ''; return; }
    element.hidden = false;
    element.textContent = text;
    element.classList.toggle('error-message', kind === 'error');
  }

  function toast(text) {
    if (!text) return;
    clearTimeout(toastTimer);
    refs.toast.textContent = text;
    refs.toast.hidden = false;
    toastTimer = setTimeout(() => { refs.toast.hidden = true; }, 2600);
  }

  function makeField(labelText, control, extraClass) {
    const label = document.createElement('label');
    label.className = `field${extraClass ? ` ${extraClass}` : ''}`;
    const span = document.createElement('span');
    span.textContent = labelText;
    label.append(span, control);
    return label;
  }

  function renderPlayers() {
    refs.playersContainer.replaceChildren();
    setupPlayers.forEach((player) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.dataset.playerId = player.id;

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.maxLength = 30;
      nameInput.value = player.name;
      nameInput.dataset.field = 'name';
      nameInput.autocomplete = 'off';
      row.appendChild(makeField(I.t('playerName'), nameInput, 'player-name-field'));

      const teamSelect = document.createElement('select');
      teamSelect.dataset.field = 'team';
      [['red', I.t('red')], ['blue', I.t('blue')], ['spectator', I.t('spectator')]].forEach(([value, label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = label; teamSelect.appendChild(option);
      });
      teamSelect.value = player.team;
      row.appendChild(makeField(I.t('team'), teamSelect));

      const roleSelect = document.createElement('select');
      roleSelect.dataset.field = 'role';
      [['operative', I.t('operative')], ['spymaster', I.t('spymaster')], ['spectator', I.t('spectator')]].forEach(([value, label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = label; roleSelect.appendChild(option);
      });
      roleSelect.value = player.role;
      row.appendChild(makeField(I.t('role'), roleSelect));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button danger';
      remove.dataset.action = 'remove-player';
      remove.textContent = I.t('remove');
      row.appendChild(remove);

      refs.playersContainer.appendChild(row);
    });
  }

  function handlePlayerChange(event) {
    const row = event.target.closest('[data-player-id]');
    if (!row) return;
    const player = setupPlayers.find((item) => item.id === row.dataset.playerId);
    if (!player) return;
    const field = event.target.dataset.field;
    if (field === 'name') player.name = event.target.value;
    if (field === 'team') {
      player.team = event.target.value;
      if (player.team === 'spectator') player.role = 'spectator';
      else if (player.role === 'spectator') player.role = 'operative';
      renderPlayers();
    }
    if (field === 'role') {
      player.role = event.target.value;
      if (player.role === 'spectator') player.team = 'spectator';
      else if (player.team === 'spectator') player.team = 'red';
      renderPlayers();
    }
  }

  function handlePlayerClick(event) {
    const button = event.target.closest('[data-action="remove-player"]');
    if (!button) return;
    const row = button.closest('[data-player-id]');
    setupPlayers = setupPlayers.filter((item) => item.id !== row.dataset.playerId);
    renderPlayers();
  }

  function addPlayer() {
    const redCount = setupPlayers.filter((p) => p.team === 'red' && p.role !== 'spectator').length;
    const blueCount = setupPlayers.filter((p) => p.team === 'blue' && p.role !== 'spectator').length;
    const team = redCount <= blueCount ? 'red' : 'blue';
    setupPlayers.push({ id: `player-${playerSequence}`, name: `Player ${playerSequence}`, team, role: 'operative' });
    playerSequence += 1;
    renderPlayers();
  }

  function randomiseTeamsAndKeepRoles() {
    setupPlayers = G.randomiseTeams(setupPlayers);
    setupPlayers = G.randomiseSpymasters(setupPlayers);
    renderPlayers();
  }

  function randomiseSpymastersOnly() {
    setupPlayers = G.randomiseSpymasters(setupPlayers);
    renderPlayers();
  }

  function activeWordPool() {
    return refs.wordSourceSelect.value === 'custom' && customWords ? customWords : CN.DEFAULT_WORDS;
  }

  function currentSettings() {
    return {
      uiLanguage: I.getLanguage(),
      cardLanguage: refs.cardLanguageSelect.value,
      strictClues: refs.strictCluesCheckbox.checked,
      expertRules: refs.expertRulesCheckbox.checked,
      wordSource: refs.wordSourceSelect.value
    };
  }

  function startGame() {
    if (isOnline()) return;
    setMessage(refs.setupMessage, '');
    const result = G.startGame({ players: setupPlayers, settings: currentSettings(), wordPool: activeWordPool() });
    if (!result.ok) {
      setMessage(refs.setupMessage, `${I.t('setupError')} ${result.errors ? result.errors.join(', ') : result.code}`, 'error');
      return;
    }
    guessBusy = false;
    viewMode = 'operative';
    render(result.state);
  }

  function renderWordText(card, state, button) {
    if (card.revealed && viewMode === 'operative') {
      const picked = document.createElement('span');
      picked.className = 'card-picked';
      picked.textContent = `✓ ${I.t('picked')}`;
      button.appendChild(picked);
      return;
    }
    const mode = state.settings.cardLanguage;
    const primary = document.createElement('span');
    primary.className = 'card-primary';
    const secondary = document.createElement('span');
    secondary.className = 'card-secondary';

    if (mode === 'ar') {
      primary.textContent = card.ar;
      button.append(primary);
    } else if (mode === 'en') {
      primary.textContent = card.en;
      button.append(primary);
    } else if (I.getLanguage() === 'ar') {
      primary.textContent = card.ar;
      secondary.textContent = card.en;
      button.append(primary, secondary);
    } else {
      primary.textContent = card.en;
      secondary.textContent = card.ar;
      button.append(primary, secondary);
    }
    if (card.revealed && viewMode === 'spymaster') {
      const picked = document.createElement('span');
      picked.className = 'picked-badge';
      picked.textContent = `✓ ${I.t('picked')}`;
      button.appendChild(picked);
    }
  }

  function roleText(role) {
    if (role === 'red') return `${I.t('red')} · ${I.t('agent')}`;
    if (role === 'blue') return `${I.t('blue')} · ${I.t('agent')}`;
    if (role === 'neutral') return I.t('neutral');
    return `⚠ ${I.t('assassin')}`;
  }

  function renderBoard(state) {
    refs.board.replaceChildren();
    state.board.forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'card-button';
      button.dataset.cardId = card.id;
      button.setAttribute('role', 'gridcell');
      renderWordText(card, state, button);

      const player = myOnlinePlayer();
      const canGuessOnline = !isOnline() || Boolean(player && player.role === 'operative' && player.team === state.currentTeam);
      const roleVisible = Boolean(card.role) && (card.revealed || (viewMode === 'spymaster' && canUseSpymasterView()) || state.status === 'ended');
      if (roleVisible) {
        button.classList.add(`role-${card.role}`);
        if (!card.revealed && viewMode === 'spymaster') button.classList.add('secret');
        const role = document.createElement('span');
        role.className = 'card-role';
        role.textContent = roleText(card.role);
        button.append(role);
      }
      if (card.revealed) button.classList.add('revealed');

      const accessibleWords = state.settings.cardLanguage === 'ar' ? card.ar : state.settings.cardLanguage === 'en' ? card.en : `${card.ar} / ${card.en}`;
      const accessibleBase = card.revealed && viewMode === 'operative' ? I.t('picked') : accessibleWords;
      button.setAttribute('aria-label', roleVisible ? `${accessibleBase}. ${roleText(card.role)}.` : accessibleBase);
      button.disabled = guessBusy || card.revealed || state.status !== 'guessing' || viewMode !== 'operative' || !canGuessOnline || Boolean(state.clueChallenge && state.clueChallenge.status === 'pending');
      refs.board.appendChild(button);
    });
  }

  function renderClue(state) {
    if (!state.currentClue) {
      refs.currentClueValue.textContent = I.t('noClue');
      refs.guessCounter.textContent = '';
      refs.expertHint.hidden = true;
      return;
    }
    const clue = state.currentClue;
    const suffix = clue.mode === 'number' ? clue.number : clue.mode === 'zero' ? '0' : '∞';
    refs.currentClueValue.textContent = `${clue.text}: ${suffix}`;
    const max = Number.isFinite(state.maxGuesses) ? state.maxGuesses : '∞';
    refs.guessCounter.textContent = `${I.t('guesses')}: ${state.guessesMade} / ${max}`;
    if (clue.mode === 'zero') { refs.expertHint.textContent = I.t('clueZeroHint'); refs.expertHint.hidden = false; }
    else if (clue.mode === 'unlimited') { refs.expertHint.textContent = I.t('clueUnlimitedHint'); refs.expertHint.hidden = false; }
    else refs.expertHint.hidden = true;
  }

  function renderPenalty(state) {
    const player = myOnlinePlayer();
    const onlineAllowed = !isOnline() || Boolean(player && player.role === 'spymaster' && state.invalidCluePenalty && player.team === state.invalidCluePenalty.team);
    const show = state.status === 'penalty' && viewMode === 'spymaster' && onlineAllowed;
    refs.penaltyPanel.hidden = !show;
    refs.penaltyCandidates.replaceChildren();
    if (!show) return;
    G.getPenaltyCandidates().forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button secondary';
      button.dataset.penaltyCardId = card.id;
      button.textContent = state.settings.cardLanguage === 'en' ? card.en : state.settings.cardLanguage === 'ar' ? card.ar : `${card.ar} / ${card.en}`;
      refs.penaltyCandidates.appendChild(button);
    });
  }

  function renderRoster(state) {
    const buckets = { red: refs.redRoster, blue: refs.blueRoster, spectator: refs.spectatorRoster };
    Object.values(buckets).forEach((node) => node && node.replaceChildren());
    (state.players || []).forEach((player) => {
      const key = player.team === 'spectator' || player.role === 'spectator' ? 'spectator' : player.team;
      const host = buckets[key];
      if (!host) return;
      const item = document.createElement('div');
      item.className = 'roster-player';
      const icon = player.role === 'spymaster' ? '🕵️' : player.role === 'spectator' ? '👁️' : '🎯';
      item.textContent = `${icon} ${player.name} · ${roleLabel(player.role)}`;
      host.appendChild(item);
    });
    if (refs.spectatorRoster && !refs.spectatorRoster.children.length) {
      const empty = document.createElement('span'); empty.className = 'small muted'; empty.textContent = '—'; refs.spectatorRoster.appendChild(empty);
    }
  }

  function cardDisplayName(card, state) {
    if (state.settings.cardLanguage === 'ar') return card.ar;
    if (state.settings.cardLanguage === 'en') return card.en;
    return I.getLanguage() === 'ar' ? `${card.ar} / ${card.en}` : `${card.en} / ${card.ar}`;
  }

  function renderGame(state) {
    refs.gameSection.classList.toggle('turn-red', state.status !== 'ended' && state.currentTeam === 'red');
    refs.gameSection.classList.toggle('turn-blue', state.status !== 'ended' && state.currentTeam === 'blue');
    refs.gameSection.classList.toggle('game-ended', state.status === 'ended');
    refs.currentTeamValue.textContent = state.currentTeam ? teamLabel(state.currentTeam) : '—';
    refs.currentTeamValue.className = `team-chip ${state.currentTeam || ''}`;
    refs.startingTeamValue.textContent = state.startingTeam ? teamLabel(state.startingTeam) : '—';
    refs.redRemaining.textContent = String(state.remaining.red);
    refs.blueRemaining.textContent = String(state.remaining.blue);
    refs.phaseValue.textContent = phaseLabel(state.status);
    refs.viewModeLabel.textContent = viewMode === 'spymaster' ? I.t('spymasterView') : I.t('operativeView');
    refs.secretWarning.hidden = viewMode !== 'spymaster';
    refs.secretWarning.textContent = I.t('rolesVisibleWarning');

    renderClue(state);
    renderRoster(state);
    renderBoard(state);
    renderPenalty(state);

    const player = myOnlinePlayer();
    const canSpy = canUseSpymasterView();
    const isCurrentSpy = !isOnline() || Boolean(player && player.role === 'spymaster' && player.team === state.currentTeam);
    const isOpposingSpy = !isOnline() || Boolean(player && player.role === 'spymaster' && player.team && player.team !== state.currentTeam);
    const isCurrentOperative = !isOnline() || Boolean(player && player.role === 'operative' && player.team === state.currentTeam);
    const canSubmitClue = state.status === 'clue' && viewMode === 'spymaster' && isCurrentSpy;
    refs.spymasterControls.hidden = !canSubmitClue;
    refs.spymasterKeyBtn.hidden = viewMode === 'spymaster' || state.status === 'ended' || (isOnline() && !canSpy);
    refs.spymasterKeyBtn.disabled = isOnline() && !onlineContext.secretReady;
    refs.hideSpymasterBtn.hidden = viewMode !== 'spymaster';
    refs.challengeClueBtn.hidden = !(state.status === 'guessing' && state.guessesMade === 0 && viewMode === 'operative' && isOpposingSpy && state.clueChallenge && state.clueChallenge.status === 'open');
    refs.endTurnBtn.disabled = guessBusy || !(state.status === 'guessing' && viewMode === 'operative' && isCurrentOperative);
    refs.endTurnBtn.hidden = state.status === 'ended' || state.status === 'penalty';
    refs.resetGameBtn.disabled = isOnline() && !onlineContext.isHost;
    refs.newGameBtn.disabled = isOnline() && !onlineContext.isHost;

    refs.winnerPanel.hidden = state.status !== 'ended';
    if (state.status === 'ended') {
      refs.winnerValue.textContent = teamLabel(state.winner);
      refs.winnerReason.textContent = state.endReason === 'ASSASSIN' ? I.t('assassinHit') : I.t('allAgentsFound');
    }

    const expert = state.settings.expertRules;
    Array.from(refs.clueModeSelect.options).forEach((option) => {
      if (option.value === 'number') option.disabled = false;
      else option.disabled = !expert;
    });
    if (!expert && refs.clueModeSelect.value !== 'number') refs.clueModeSelect.value = 'number';
    refs.clueNumberField.hidden = refs.clueModeSelect.value !== 'number';
  }

  function render(state) {
    applyTranslations();
    if (runtimeMode === 'menu') {
      refs.setupSection.hidden = true;
      refs.gameSection.hidden = true;
      return;
    }
    if (runtimeMode === 'online') {
      refs.setupSection.hidden = true;
      const showGame = onlineContext.inRoom && onlineContext.roomStatus === 'playing' && state.status !== 'setup';
      refs.gameSection.hidden = !showGame;
      if (showGame) renderGame(state);
      return;
    }
    const isSetup = state.status === 'setup';
    refs.setupSection.hidden = !isSetup;
    refs.gameSection.hidden = isSetup;
    if (isSetup) {
      renderPlayers();
      refs.cardLanguageSelect.value = state.settings.cardLanguage || refs.cardLanguageSelect.value;
      refs.strictCluesCheckbox.checked = state.settings.strictClues !== false;
      refs.expertRulesCheckbox.checked = Boolean(state.settings.expertRules);
      if (refs.wordSourceSelect.value === 'custom' && !customWords) refs.wordSourceSelect.value = 'default';
      updateCustomStatus();
    } else renderGame(state);
  }

  function mapClueError(code) {
    if (code === 'EMPTY_CLUE') return I.t('clueRequired');
    if (code === 'MULTI_WORD_CLUE') return I.t('clueOneWord');
    if (code === 'CLUE_MATCHES_VISIBLE_WORD') return I.t('clueMatchesBoard');
    if (code === 'INVALID_NUMBER') return I.t('invalidNumber');
    if (code === 'EXPERT_RULES_DISABLED') return I.t('expertRules');
    return code;
  }

  async function submitClue(event) {
    event.preventDefault();
    setMessage(refs.clueValidationMessage, '');
    const mode = refs.clueModeSelect.value;
    const input = { text: refs.clueTextInput.value, mode, number: Number(refs.clueNumberInput.value) };
    const result = isOnline() ? await requestOnlineAction('submitClue', input) : G.submitClue(input);
    if (!result.ok) {
      const text = result.validation ? result.validation.errors.map(mapClueError).join(' ') : (result.code || 'ONLINE_ERROR');
      setMessage(refs.clueValidationMessage, text, 'error');
      return;
    }
    refs.clueTextInput.value = '';
    viewMode = 'operative';
    toast(I.t('readyToGuess'));
    render(G.getState());
  }

  async function handleBoardClick(event) {
    const button = event.target.closest('[data-card-id]');
    if (!button || button.disabled || viewMode !== 'operative' || guessBusy) return;

    const before = G.getState();
    const card = before.board.find((item) => item.id === button.dataset.cardId);
    if (!card || card.revealed || before.status !== 'guessing') return;

    const teamBefore = before.currentTeam;
    guessBusy = true;
    refs.board.setAttribute('aria-busy', 'true');
    button.classList.add('guess-pending');
    if (CN.Effects) CN.Effects.sound('confirm');

    try {
      // Clicking a card is the final guess in V7; there is no candidate stage.
      // الضغط على البطاقة هو التخمين النهائي مباشرة في V7 بدون مرحلة بطاقات محتملة.
      const result = isOnline() ? await requestOnlineAction('guess', { cardId: card.id }) : G.handleGuess(card.id);
      if (!result.ok) {
        if (result.code === 'CHALLENGE_PENDING') toast(I.t('challengePending'));
        else toast(result.code || I.t('wrongPhase'));
        return;
      }

      const state = G.getState();
      if (state.status === 'ended') toast(state.endReason === 'ASSASSIN' ? I.t('assassinHit') : I.t('allAgentsFound'));
      else if (state.currentTeam !== teamBefore) toast(I.t('turnEnded'));
      else toast(I.t('guessedOwn'));
    } finally {
      guessBusy = false;
      refs.board.removeAttribute('aria-busy');
      render(G.getState());
    }
  }

  async function endTurn() {
    const result = isOnline() ? await requestOnlineAction('endTurn', {}) : G.endTurn('VOLUNTARY');
    if (!result.ok) {
      toast(result.code === 'MUST_GUESS_FIRST' ? I.t('mustGuessFirst') : (result.code || I.t('wrongPhase')));
      return;
    }
    toast(I.t('turnEnded'));
  }

  function openPrivacy() {
    cancelHold();
    if (typeof refs.privacyDialog.showModal === 'function') refs.privacyDialog.showModal();
    else refs.privacyDialog.setAttribute('open', '');
  }

  function completeHold() {
    cancelHold(false);
    if (!canUseSpymasterView()) { toast('Spymaster access is not available on this device.'); return; }
    viewMode = 'spymaster';
    if (refs.privacyDialog.open) refs.privacyDialog.close();
    render(G.getState());
  }

  function updateHoldProgress() {
    if (!holdStart) return;
    const elapsed = performance.now() - holdStart;
    const pct = Math.min(100, (elapsed / 750) * 100);
    refs.holdProgress.style.width = `${pct}%`;
    if (pct < 100) holdAnimation = requestAnimationFrame(updateHoldProgress);
  }

  function beginHold(event) {
    event.preventDefault();
    cancelHold();
    holdStart = performance.now();
    holdAnimation = requestAnimationFrame(updateHoldProgress);
    holdTimer = setTimeout(completeHold, 750);
  }

  function cancelHold(resetWidth) {
    if (holdTimer) clearTimeout(holdTimer);
    if (holdAnimation) cancelAnimationFrame(holdAnimation);
    holdTimer = null;
    holdAnimation = null;
    holdStart = 0;
    if (resetWidth !== false && refs.holdProgress) refs.holdProgress.style.width = '0%';
  }

  function hideSpymaster() {
    viewMode = 'operative';
    render(G.getState());
  }

  async function challengeClue() {
    const stateBefore = G.getState();
    const result = isOnline() ? await requestOnlineAction('challengeClue', {}) : G.challengeClue();
    if (!result.ok) { toast(result.code || I.t('wrongPhase')); return; }
    refs.challengeClueText.textContent = stateBefore.currentClue ? `${stateBefore.currentClue.text}: ${stateBefore.currentClue.mode === 'number' ? stateBefore.currentClue.number : stateBefore.currentClue.mode === 'zero' ? 0 : '∞'}` : '';
    refs.challengeDialog.showModal();
  }

  async function allowClue() {
    const result = isOnline() ? await requestOnlineAction('resolveChallenge', { decision: 'allow' }) : G.resolveClueChallenge('allow');
    if (refs.challengeDialog.open) refs.challengeDialog.close();
    if (result.ok) toast(I.t('readyToGuess')); else toast(result.code || I.t('wrongPhase'));
  }

  async function rejectClue() {
    const result = isOnline() ? await requestOnlineAction('resolveChallenge', { decision: 'reject' }) : G.resolveClueChallenge('reject');
    if (refs.challengeDialog.open) refs.challengeDialog.close();
    if (result.ok) {
      viewMode = 'operative';
      if (!isOnline()) openPrivacy();
    } else toast(result.code || I.t('wrongPhase'));
  }

  async function handlePenaltyClick(event) {
    const button = event.target.closest('[data-penalty-card-id]');
    if (!button) return;
    const result = isOnline() ? await requestOnlineAction('resolvePenalty', { cardId: button.dataset.penaltyCardId }) : G.resolveInvalidCluePenalty(button.dataset.penaltyCardId);
    if (!result.ok) { toast(result.code || I.t('wrongPhase')); return; }
    viewMode = 'operative';
    render(G.getState());
  }

  async function skipPenalty() {
    const result = isOnline() ? await requestOnlineAction('resolvePenalty', { cardId: null }) : G.resolveInvalidCluePenalty(null);
    if (result.ok) { viewMode = 'operative'; render(G.getState()); }
    else toast(result.code || I.t('wrongPhase'));
  }

  function changeUiLanguage() {
    const lang = refs.uiLanguageGlobal.value === 'en' ? 'en' : 'ar';
    I.setLanguage(lang);
    if (!isOnline()) G.updateSettings({ uiLanguage: lang });
    else render(G.getState());
  }

  function changeClueMode() {
    refs.clueNumberField.hidden = refs.clueModeSelect.value !== 'number';
  }

  function updateCustomStatus() {
    if (!customWords) {
      refs.customWordsStatus.textContent = `${CN.DEFAULT_WORDS.length} ${I.t('defaultWords')}`;
      refs.wordSourceSelect.querySelector('option[value="custom"]').disabled = true;
      return;
    }
    refs.wordSourceSelect.querySelector('option[value="custom"]').disabled = false;
    refs.customWordsStatus.textContent = `${customWords.length} ${I.t('customWords')}`;
  }

  function openWordsDialog() {
    refs.wordImportResult.hidden = true;
    refs.wordsDialog.showModal();
  }

  function readFileText(file) {
    if (file.text) return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read failed'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  function typeFromFile(file, selected) {
    if (selected !== 'auto' || !file) return selected;
    const name = file.name.toLowerCase();
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.csv')) return 'csv';
    return 'txt';
  }

  async function importWords() {
    try {
      const file = refs.wordFileInput.files && refs.wordFileInput.files[0];
      if (file && file.size > G.MAX_IMPORT_BYTES) {
        setMessage(refs.wordImportResult, 'FILE_TOO_LARGE', 'error'); return;
      }
      const raw = file ? await readFileText(file) : refs.wordTextarea.value;
      const format = typeFromFile(file, refs.wordFormatSelect.value);
      const result = G.importCustomWords(raw, format);
      const summary = `${I.t('accepted')}: ${result.acceptedCount || 0} · ${I.t('rejected')}: ${result.rejectedCount || 0}`;
      if (!result.valid) {
        setMessage(refs.wordImportResult, `${summary}. ${I.t('customNeed25')} ${result.errors ? result.errors.join(', ') : ''}`, 'error');
        return;
      }
      customWords = result.words;
      refs.wordSourceSelect.querySelector('option[value="custom"]').disabled = false;
      refs.wordSourceSelect.value = 'custom';
      updateCustomStatus();
      setMessage(refs.wordImportResult, `${summary}. ${I.t('customLoaded')}`);
    } catch (error) {
      G.logError(error, { code: 'WORD_IMPORT_UI' }, true);
      setMessage(refs.wordImportResult, error.message, 'error');
    }
  }

  function revertWords() {
    customWords = null;
    refs.wordSourceSelect.value = 'default';
    refs.wordSourceSelect.querySelector('option[value="custom"]').disabled = true;
    refs.wordFileInput.value = '';
    refs.wordTextarea.value = '';
    updateCustomStatus();
    setMessage(refs.wordImportResult, I.t('defaultWords'));
  }

  function openLogs(type) {
    currentLogType = type;
    refs.logsTitle.textContent = type === 'errors' ? I.t('errorLog') : I.t('gameLog');
    renderLogs();
    refs.logsDialog.showModal();
  }

  function currentLogs() {
    const state = G.getState();
    return currentLogType === 'errors' ? state.errorLogs : state.logs;
  }

  function renderLogs() {
    const list = currentLogs();
    refs.logsContent.replaceChildren();
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = currentLogType === 'errors' ? I.t('noErrors') : I.t('noEvents');
      refs.logsContent.appendChild(empty);
      return;
    }
    list.slice().reverse().forEach((entry) => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.textContent = JSON.stringify(entry, null, 2);
      refs.logsContent.appendChild(div);
    });
  }

  async function copyLogs() {
    const text = JSON.stringify(currentLogs(), null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea');
        area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      }
      toast(I.t('copied'));
    } catch (error) { toast(I.t('copyFailed')); }
  }

  function downloadLogs() {
    U.downloadText(`codenames-${currentLogType}-logs.json`, JSON.stringify(currentLogs(), null, 2), 'application/json;charset=utf-8');
  }

  function clearLogs() {
    G.clearLogs(currentLogType === 'errors' ? 'errors' : 'game');
    renderLogs();
  }

  async function resetRound() {
    if (!global.confirm(I.t('resetConfirm'))) return;
    if (isOnline()) {
      const result = await requestOnlineAction('resetRound', {});
      if (!result.ok) toast(result.code || 'HOST_ONLY');
      return;
    }
    const result = G.resetGame({ wordPool: activeWordPool(), customWords });
    if (result.ok) { guessBusy = false; viewMode = 'operative'; render(G.getState()); }
  }

  async function newGame() {
    if (!global.confirm(I.t('newGameConfirm'))) return;
    if (isOnline()) {
      const result = await requestOnlineAction('returnLobby', {});
      if (!result.ok) toast(result.code || 'HOST_ONLY');
      return;
    }
    G.newGameToSetup();
    guessBusy = false;
    viewMode = 'operative';
    render(G.getState());
  }

  function bindEvents() {
    if (refs.playLocalBtn) refs.playLocalBtn.addEventListener('click', showLocalSetup);
    refs.addPlayerBtn.addEventListener('click', addPlayer);
    refs.randomTeamsBtn.addEventListener('click', randomiseTeamsAndKeepRoles);
    refs.randomSpiesBtn.addEventListener('click', randomiseSpymastersOnly);
    refs.playersContainer.addEventListener('input', handlePlayerChange);
    refs.playersContainer.addEventListener('change', handlePlayerChange);
    refs.playersContainer.addEventListener('click', handlePlayerClick);
    refs.startGameBtn.addEventListener('click', startGame);
    refs.uiLanguageGlobal.addEventListener('change', changeUiLanguage);
    refs.manageWordsBtn.addEventListener('click', openWordsDialog);
    refs.closeWordsBtn.addEventListener('click', () => refs.wordsDialog.close());
    refs.importWordsBtn.addEventListener('click', importWords);
    refs.revertWordsBtn.addEventListener('click', revertWords);

    refs.board.addEventListener('click', handleBoardClick);
    refs.clueForm.addEventListener('submit', submitClue);
    refs.clueModeSelect.addEventListener('change', changeClueMode);
    refs.endTurnBtn.addEventListener('click', endTurn);
    refs.spymasterKeyBtn.addEventListener('click', openPrivacy);
    refs.hideSpymasterBtn.addEventListener('click', hideSpymaster);
    refs.holdRevealBtn.addEventListener('pointerdown', beginHold);
    ['pointerup','pointercancel','pointerleave'].forEach((name) => refs.holdRevealBtn.addEventListener(name, () => cancelHold()));
    refs.challengeClueBtn.addEventListener('click', challengeClue);
    refs.allowClueBtn.addEventListener('click', allowClue);
    refs.rejectClueBtn.addEventListener('click', rejectClue);
    refs.penaltyCandidates.addEventListener('click', handlePenaltyClick);
    refs.skipPenaltyBtn.addEventListener('click', skipPenalty);

    refs.gameLogBtn.addEventListener('click', () => openLogs('game'));
    refs.errorLogBtn.addEventListener('click', () => openLogs('errors'));
    refs.closeLogsBtn.addEventListener('click', () => refs.logsDialog.close());
    refs.copyLogsBtn.addEventListener('click', copyLogs);
    refs.downloadLogsBtn.addEventListener('click', downloadLogs);
    refs.clearLogsBtn.addEventListener('click', clearLogs);
    refs.resetGameBtn.addEventListener('click', resetRound);
    refs.newGameBtn.addEventListener('click', newGame);
  }

  function init() {
    cacheRefs();
    I.setLanguage('ar');
    bindEvents();
    G.subscribe((state) => render(state));
    render(G.getState());
  }

  CN.UI = { init, render, setRuntimeMode, setOnlineContext, showLocalSetup, getRuntimeMode: () => runtimeMode, getOnlineContext: () => Object.assign({}, onlineContext), getCustomWords: () => customWords, getViewMode: () => viewMode };
})(window);
