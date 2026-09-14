import { CONFIG } from './config.js';
import { findAnswerResult, matchQuestionAnswer, normalizeText } from './matching.js';

const clone = value => JSON.parse(JSON.stringify(value));
const shuffle = items => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class GameEngine {
  constructor({ questions, language = 'en', settings, onChange = () => {}, onEvent = () => {} }) {
    this.questions = questions;
    this.language = language;
    this.settings = settings;
    this.onChange = onChange;
    this.onEvent = onEvent;
    this.timerId = null;
    this.aiTimeout = null;
    this.queue = [];
    this.state = null;
  }

  setLanguage(lang) { this.language = lang; this._notify(); }
  setQuestions(questions) { this.questions = questions; }
  destroy() { this._clearAsync(); this.state = null; }

  start(mode, playerNames) {
    this._clearAsync();
    this.queue = shuffle(this.questions);
    const names = playerNames.map((name, i) => (String(name || '').trim() || `Player ${i + 1}`).slice(0, 24));
    this.state = {
      mode,
      phase: 'round_intro',
      players: names.map((name, i) => ({ id: i, name, score: 0, correct: 0, wrong: 0 })),
      round: 0,
      maxRounds: mode === 'traditional' ? CONFIG.TRADITIONAL_ROUND_MULTIPLIERS.length : CONFIG.CLASSIC_ROUNDS,
      activePlayer: 0,
      question: null,
      revealedIds: new Set(),
      remainingTime: 0,
      roundHistory: [],
      roundStartScores: [0, 0],
      message: null,
      strikes: 0,
      roundPot: 0,
      controller: 0,
      faceoff: [null, null],
      fastMoney: null,
      winner: null,
      suddenDeath: false
    };

    if (mode === 'fastmoney') return this._startFastMoney();
    if (mode === 'traditional') return this._startTraditionalRound();
    return this._startClassicRound();
  }

  getState() {
    if (!this.state) return null;
    return { ...this.state, revealedIds: new Set(this.state.revealedIds) };
  }

  submit(input) {
    if (!this.state) return { type: 'ignored' };
    if (this.state.mode === 'fastmoney') return this._submitFastMoney(input);
    if (this.state.mode === 'traditional') return this._submitTraditional(input);
    return this._submitClassic(input);
  }

  choosePlayPass(choice) {
    const s = this.state;
    if (!s || s.mode !== 'traditional' || s.phase !== 'play_pass') return;
    const faceoffWinner = s.controller;
    s.controller = choice === 'pass' ? 1 - faceoffWinner : faceoffWinner;
    s.activePlayer = s.controller;
    s.phase = 'team_play';
    s.message = null;
    this._notify();
  }

  nextRound() {
    const s = this.state;
    if (!s || s.phase !== 'round_result') return;
    s.round += 1;
    if (s.round >= s.maxRounds) return this._finishGame();
    if (s.mode === 'traditional') this._startTraditionalRound();
    else this._startClassicRound();
  }

  startSecondFastMoney() {
    const s = this.state;
    if (!s || s.mode !== 'fastmoney' || s.phase !== 'fm_transition') return;
    s.fastMoney.player = 1;
    s.fastMoney.index = 0;
    s.activePlayer = 1;
    s.question = s.fastMoney.questions[0];
    s.phase = 'fm_answering';
    this._startTimer(CONFIG.FAST_MONEY_TIME_PER_PLAYER, () => this._finishFastMoneyPlayer());
    this._notify();
  }

  pause() {
    if (!this.state || !['round_active','team_play','faceoff_a','faceoff_b','steal','fm_answering','sudden_death'].includes(this.state.phase)) return;
    this.state.prePausePhase = this.state.phase;
    this.state.phase = 'paused';
    this._stopTimer();
    if (this.aiTimeout) { clearTimeout(this.aiTimeout); this.aiTimeout = null; }
    this._notify();
  }

  resume() {
    const s = this.state;
    if (!s || s.phase !== 'paused') return;
    s.phase = s.prePausePhase || 'round_active';
    delete s.prePausePhase;
    this._startTimer(s.remainingTime, () => this._handleTimerExpired());
    this._notify();
    this._scheduleAIIfNeeded();
  }

  _drawQuestion() {
    if (!this.queue.length) this.queue = shuffle(this.questions);
    return this.queue.pop();
  }

  _resetRoundCommon(question) {
    const s = this.state;
    s.question = question;
    s.revealedIds = new Set();
    s.message = null;
    s.roundStartScores = s.players.map(p => p.score);
    s.strikes = 0;
    s.roundPot = 0;
    s.faceoff = [null, null];
  }

  _startClassicRound() {
    const s = this.state;
    this._clearAsync();
    this._resetRoundCommon(this._drawQuestion());
    s.phase = 'round_intro';
    s.activePlayer = s.round % 2;
    this._notify();
    setTimeout(() => {
      if (!this.state || this.state !== s || s.phase !== 'round_intro') return;
      s.phase = s.suddenDeath ? 'sudden_death' : 'round_active';
      this._startTimer(Number(this.settings.roundTime) || CONFIG.CLASSIC_ROUND_TIME, () => this._endClassicRound('time'));
      this._notify();
      this._scheduleAIIfNeeded();
    }, this.settings.reducedMotion ? 80 : 850);
  }

  _submitClassic(input, fromAI = false) {
    const s = this.state;
    if (!s || !['round_active','sudden_death'].includes(s.phase)) return { type: 'ignored' };
    if (s.mode === 'classic-ai' && s.activePlayer === 1 && !fromAI) return { type: 'ignored' };
    const result = findAnswerResult(s.question, input, this.language, s.revealedIds);
    if (result.type === 'empty') { this._event('empty', {}); return result; }
    if (result.type === 'duplicate') { this._event('duplicate', { answer: result.answer }); return result; }

    const player = s.players[s.activePlayer];
    if (result.type === 'correct') {
      s.revealedIds.add(result.answer.id);
      player.score += result.answer.points;
      player.correct += 1;
      this._event('correct', { playerId: s.activePlayer, answer: result.answer, top: s.question.answers[0]?.id === result.answer.id });
      if (s.phase === 'sudden_death') {
        s.winner = s.activePlayer;
        return this._finishGame();
      }
    } else {
      player.wrong += 1;
      player.score = CONFIG.ALLOW_NEGATIVE_SCORE ? player.score - CONFIG.WRONG_GUESS_PENALTY : Math.max(0, player.score - CONFIG.WRONG_GUESS_PENALTY);
      this._event('wrong', { playerId: s.activePlayer, penalty: CONFIG.WRONG_GUESS_PENALTY });
    }

    if (s.revealedIds.size >= s.question.answers.length) return this._endClassicRound('cleared');
    s.activePlayer = 1 - s.activePlayer;
    this._notify();
    this._scheduleAIIfNeeded();
    return result;
  }

  _scheduleAIIfNeeded() {
    const s = this.state;
    if (!s || s.mode !== 'classic-ai' || s.activePlayer !== 1 || !['round_active','sudden_death'].includes(s.phase)) return;
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    const cfg = CONFIG.AI[this.settings.aiDifficulty] || CONFIG.AI.medium;
    const delay = Math.floor(cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay));
    this._event('aiThinking', {});
    this.aiTimeout = setTimeout(() => {
      this.aiTimeout = null;
      if (!this.state || this.state !== s || s.activePlayer !== 1 || !['round_active','sudden_death'].includes(s.phase)) return;
      const unrevealed = s.question.answers.filter(a => !s.revealedIds.has(a.id));
      if (!unrevealed.length) return;
      let guess;
      if (Math.random() < cfg.accuracy) {
        const weighted = [...unrevealed].sort((a,b) => b.points - a.points);
        const bias = this.settings.aiDifficulty === 'hard' ? 0.65 : this.settings.aiDifficulty === 'easy' ? 0.25 : 0.45;
        guess = Math.random() < bias ? weighted[0].text[this.language] : weighted[Math.floor(Math.random() * weighted.length)].text[this.language];
      } else {
        guess = this.language === 'ar' ? 'إجابة غير موجودة' : 'unlikely answer';
      }
      this._submitClassic(guess, true);
    }, delay);
  }

  _endClassicRound(reason) {
    const s = this.state;
    if (!s || !['round_active','sudden_death'].includes(s.phase)) return;
    this._clearAsync();
    s.phase = 'round_result';
    const roundScores = s.players.map((p, i) => p.score - s.roundStartScores[i]);
    s.roundHistory.push({ round: s.round + 1, scores: [...roundScores], totals: s.players.map(p => p.score), reason });
    this._event('roundEnd', { reason, remainingAnswers: s.question.answers.filter(a => !s.revealedIds.has(a.id)) });
    this._notify();
  }

  _startSuddenDeath() {
    const s = this.state;
    s.suddenDeath = true;
    s.round = s.maxRounds;
    s.maxRounds += 1;
    this._startClassicRound();
  }

  _startTraditionalRound() {
    const s = this.state;
    this._clearAsync();
    this._resetRoundCommon(this._drawQuestion());
    s.phase = 'round_intro';
    s.activePlayer = 0;
    s.controller = 0;
    this._notify();
    setTimeout(() => {
      if (!this.state || this.state !== s || s.phase !== 'round_intro') return;
      s.phase = 'faceoff_a';
      this._startTimer(Number(this.settings.roundTime) || CONFIG.TRADITIONAL_ROUND_TIME, () => this._endTraditionalRound('time'));
      this._notify();
    }, this.settings.reducedMotion ? 80 : 850);
  }

  _submitTraditional(input) {
    const s = this.state;
    if (!s || !['faceoff_a','faceoff_b','team_play','steal'].includes(s.phase)) return { type: 'ignored' };
    if (s.phase === 'faceoff_a' || s.phase === 'faceoff_b') return this._submitFaceoff(input);
    const result = findAnswerResult(s.question, input, this.language, s.revealedIds);
    if (result.type === 'empty') { this._event('empty', {}); return result; }
    if (result.type === 'duplicate') { this._event('duplicate', { answer: result.answer }); return result; }
    const multiplier = CONFIG.TRADITIONAL_ROUND_MULTIPLIERS[s.round] || 1;

    if (s.phase === 'steal') {
      const stealing = s.activePlayer;
      if (result.type === 'correct') {
        s.revealedIds.add(result.answer.id);
        s.roundPot += result.answer.points * multiplier;
        s.players[stealing].score += s.roundPot;
        s.players[stealing].correct += 1;
        this._event('stealSuccess', { playerId: stealing, answer: result.answer, pot: s.roundPot });
      } else {
        s.players[stealing].wrong += 1;
        s.players[s.controller].score += s.roundPot;
        this._event('stealFailed', { playerId: stealing, controller: s.controller, pot: s.roundPot });
      }
      return this._endTraditionalRound('steal');
    }

    if (result.type === 'correct') {
      s.revealedIds.add(result.answer.id);
      s.roundPot += result.answer.points * multiplier;
      s.players[s.controller].correct += 1;
      this._event('correct', { playerId: s.controller, answer: result.answer, top: s.question.answers[0]?.id === result.answer.id, pot: s.roundPot });
      if (s.revealedIds.size >= s.question.answers.length) {
        s.players[s.controller].score += s.roundPot;
        return this._endTraditionalRound('sweep');
      }
    } else {
      s.strikes += 1;
      s.players[s.controller].wrong += 1;
      this._event('strike', { strikes: s.strikes });
      if (s.strikes >= 3) {
        s.phase = 'steal';
        s.activePlayer = 1 - s.controller;
        this._notify();
        return result;
      }
    }
    this._notify();
    return result;
  }

  _submitFaceoff(input) {
    const s = this.state;
    const team = s.phase === 'faceoff_a' ? 0 : 1;
    const normalized = normalizeText(input, this.language);
    if (!normalized) { this._event('empty', {}); return { type: 'empty' }; }
    const answer = matchQuestionAnswer(s.question, input, this.language);
    const rank = answer ? s.question.answers.findIndex(a => a.id === answer.id) : Number.POSITIVE_INFINITY;
    s.faceoff[team] = { input: normalized, answerId: answer?.id || null, rank };
    if (answer && !s.revealedIds.has(answer.id)) {
      s.revealedIds.add(answer.id);
      const mult = CONFIG.TRADITIONAL_ROUND_MULTIPLIERS[s.round] || 1;
      s.roundPot += answer.points * mult;
      this._event('correct', { playerId: team, answer, faceoff: true, pot: s.roundPot });
    } else if (!answer) this._event('wrong', { playerId: team, faceoff: true, penalty: 0 });

    if (team === 0) {
      s.phase = 'faceoff_b';
      s.activePlayer = 1;
    } else {
      const [a, b] = s.faceoff;
      if (a.rank === b.rank) s.controller = Math.random() < 0.5 ? 0 : 1;
      else s.controller = a.rank < b.rank ? 0 : 1;
      s.activePlayer = s.controller;
      s.phase = 'play_pass';
      this._event('faceoffResult', { winner: s.controller, faceoff: clone(s.faceoff) });
    }
    this._notify();
    return { type: answer ? 'correct' : 'wrong', answer };
  }

  _endTraditionalRound(reason) {
    const s = this.state;
    if (!s || s.mode !== 'traditional' || s.phase === 'round_result') return;
    this._clearAsync();
    s.phase = 'round_result';
    const roundScores = s.players.map((p, i) => p.score - s.roundStartScores[i]);
    s.roundHistory.push({ round: s.round + 1, scores: roundScores, totals: s.players.map(p => p.score), reason });
    this._event('roundEnd', { reason, remainingAnswers: s.question.answers.filter(a => !s.revealedIds.has(a.id)) });
    this._notify();
  }

  _startFastMoney() {
    const s = this.state;
    this._clearAsync();
    const questions = Array.from({ length: CONFIG.FAST_MONEY_QUESTIONS }, () => this._drawQuestion());
    s.maxRounds = 1;
    s.round = 0;
    s.fastMoney = {
      questions,
      player: 0,
      index: 0,
      responses: [Array(CONFIG.FAST_MONEY_QUESTIONS).fill(null), Array(CONFIG.FAST_MONEY_QUESTIONS).fill(null)]
    };
    s.activePlayer = 0;
    s.question = questions[0];
    s.phase = 'fm_answering';
    this._startTimer(CONFIG.FAST_MONEY_TIME_PER_PLAYER, () => this._finishFastMoneyPlayer());
    this._notify();
  }

  _submitFastMoney(input) {
    const s = this.state;
    if (!s || s.mode !== 'fastmoney' || s.phase !== 'fm_answering') return { type: 'ignored' };
    const normalized = normalizeText(input, this.language);
    if (!normalized) { this._event('empty', {}); return { type: 'empty' }; }
    const { player, index, questions, responses } = s.fastMoney;
    const question = questions[index];
    const answer = matchQuestionAnswer(question, input, this.language);
    if (player === 1 && answer && responses[0][index]?.answerId === answer.id) {
      this._event('tryAnother', {});
      return { type: 'duplicate-opponent' };
    }
    responses[player][index] = {
      input: String(input).trim().slice(0, 60),
      answerId: answer?.id || null,
      points: answer?.points || 0,
      display: answer?.text?.[this.language] || String(input).trim().slice(0, 60)
    };
    if (answer) s.players[player].correct += 1; else s.players[player].wrong += 1;
    s.fastMoney.index += 1;
    if (s.fastMoney.index >= CONFIG.FAST_MONEY_QUESTIONS) return this._finishFastMoneyPlayer();
    s.question = questions[s.fastMoney.index];
    this._notify();
    return { type: answer ? 'correct' : 'wrong', answer };
  }

  _finishFastMoneyPlayer() {
    const s = this.state;
    if (!s || s.mode !== 'fastmoney') return;
    this._stopTimer();
    const fm = s.fastMoney;
    while (fm.index < CONFIG.FAST_MONEY_QUESTIONS) {
      fm.responses[fm.player][fm.index] = { input: '—', answerId: null, points: 0, display: '—' };
      fm.index += 1;
    }
    if (fm.player === 0) {
      s.phase = 'fm_transition';
      s.question = null;
      this._notify();
      return;
    }
    const totals = fm.responses.map(rows => rows.reduce((sum, r) => sum + (r?.points || 0), 0));
    s.players[0].score = totals[0];
    s.players[1].score = totals[1];
    s.winner = totals[0] === totals[1] ? null : (totals[0] > totals[1] ? 0 : 1);
    s.phase = 'fm_results';
    this._event('fastMoneyResults', { totals, combined: totals[0] + totals[1] });
    this._notify();
  }

  _finishGame() {
    const s = this.state;
    this._clearAsync();
    if (s.mode !== 'fastmoney') {
      if (s.players[0].score === s.players[1].score && !s.suddenDeath && s.mode !== 'traditional') return this._startSuddenDeath();
      s.winner = s.players[0].score === s.players[1].score ? null : (s.players[0].score > s.players[1].score ? 0 : 1);
    }
    s.phase = 'game_over';
    this._event('gameOver', { winner: s.winner });
    this._notify();
  }

  finishFastMoneyResults() {
    if (!this.state || this.state.phase !== 'fm_results') return;
    this._finishGame();
  }

  _handleTimerExpired() {
    const s = this.state;
    if (!s) return;
    if (s.mode === 'fastmoney') return this._finishFastMoneyPlayer();
    if (s.mode === 'traditional') {
      if (['faceoff_a','faceoff_b','team_play','steal'].includes(s.phase)) {
        if (s.roundPot > 0) s.players[s.controller].score += s.roundPot;
        return this._endTraditionalRound('time');
      }
      return;
    }
    if (['round_active','sudden_death'].includes(s.phase)) this._endClassicRound('time');
  }

  _startTimer(seconds, onExpire) {
    this._stopTimer();
    const s = this.state;
    if (!s) return;
    s.remainingTime = Math.max(0, Math.floor(seconds));
    const startedAt = Date.now();
    const initial = s.remainingTime;
    this.timerId = setInterval(() => {
      if (!this.state || this.state !== s) return this._stopTimer();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, initial - elapsed);
      if (next !== s.remainingTime) {
        s.remainingTime = next;
        if (next <= 10 && next > 0) this._event('countdown', { value: next });
        this._notify();
      }
      if (next <= 0) {
        this._stopTimer();
        onExpire?.();
      }
    }, 250);
  }

  _stopTimer() { if (this.timerId) clearInterval(this.timerId); this.timerId = null; }
  _clearAsync() { this._stopTimer(); if (this.aiTimeout) clearTimeout(this.aiTimeout); this.aiTimeout = null; }
  _notify() { this.onChange(this.getState()); }
  _event(type, payload) { this.onEvent(type, payload, this.getState()); }
}
