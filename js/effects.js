(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};
  const G = CN.Game;
  const I = CN.I18n;

  let ctx = null;
  let muted = false;
  let volume = 0.55;
  let lastSeenKey = '';
  let roundId = null;
  let overlayQueue = Promise.resolve();
  let overlayGeneration = 0;
  let suppressTurnStartTeam = null;

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* optional */ }
  }
  function ensureAudio() {
    if (muted) return null;
    const AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  function tone(freq, duration, type, gain, delay) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + (delay || 0);
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * (gain || 0.12)), start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp); amp.connect(audio.destination);
    osc.start(start); osc.stop(start + duration + 0.02);
  }
  function sound(name) {
    if (muted) return;
    switch (name) {
      case 'click': tone(520,.06,'sine',.09); break;
      case 'select': tone(660,.07,'triangle',.09); break;
      case 'deselect': tone(430,.06,'triangle',.07); break;
      case 'confirm': tone(520,.07,'sine',.1); tone(760,.09,'sine',.11,.06); break;
      case 'gameStart': tone(392,.12,'sine',.11); tone(523,.14,'sine',.11,.09); tone(659,.18,'sine',.12,.18); break;
      case 'turnStart': tone(420,.08,'triangle',.08); tone(560,.11,'triangle',.08,.07); break;
      case 'turnEnd': tone(560,.08,'triangle',.08); tone(390,.12,'triangle',.08,.06); break;
      case 'clue': tone(620,.09,'sine',.08); tone(800,.12,'sine',.08,.08); break;
      case 'correct': tone(523,.08,'sine',.09); tone(659,.1,'sine',.1,.06); break;
      case 'opponent': tone(330,.1,'square',.06); tone(260,.12,'square',.06,.07); break;
      case 'neutral': tone(360,.1,'sine',.06); tone(285,.13,'sine',.055,.07); break;
      case 'assassin': tone(160,.24,'sawtooth',.11); tone(95,.34,'square',.08,.08); break;
      case 'win': tone(523,.1,'sine',.1); tone(659,.12,'sine',.1,.08); tone(784,.16,'sine',.12,.16); tone(1047,.24,'sine',.1,.25); break;
      case 'lose': tone(330,.11,'triangle',.08); tone(247,.14,'triangle',.08,.09); tone(196,.2,'sine',.08,.18); break;
      case 'challenge': tone(310,.09,'square',.06); tone(310,.09,'square',.06,.12); break;
      default: break;
    }
  }

  function reducedMotion() {
    return Boolean(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function teamTurnText(team) {
    return I.t(team === 'blue' ? 'blueTurn' : 'redTurn');
  }

  function removeTurnOverlays() {
    document.querySelectorAll('.turn-overlay').forEach((node) => node.remove());
  }

  function queueOverlay(task) {
    const generation = overlayGeneration;
    overlayQueue = overlayQueue
      .then(() => generation === overlayGeneration ? task(generation) : undefined)
      .catch((error) => {
        if (G && G.logError) G.logError(error, { code: 'TURN_OVERLAY_ERROR' }, false);
      });
  }

  function createTurnOverlay(team, options) {
    const opts = options || {};
    const layer = document.createElement('div');
    layer.className = `turn-overlay team-${team}${opts.transfer ? ' transfer' : ''}${opts.wrong ? ' wrong' : ''}`;
    layer.setAttribute('role', 'status');
    layer.setAttribute('aria-live', 'assertive');
    layer.setAttribute('aria-atomic', 'true');

    const card = document.createElement('div');
    card.className = 'turn-overlay-card';
    if (opts.fromTeam) card.classList.add(`from-${opts.fromTeam}`);
    if (opts.toTeam) card.classList.add(`to-${opts.toTeam}`);

    const icon = document.createElement('div');
    icon.className = 'turn-overlay-icon';
    icon.textContent = opts.wrong ? '×' : (team === 'blue' ? '●' : '●');

    const title = document.createElement('div');
    title.className = 'turn-overlay-title';
    title.textContent = opts.title || teamTurnText(team);

    const subtitle = document.createElement('div');
    subtitle.className = 'turn-overlay-subtitle';
    subtitle.textContent = opts.subtitle || '';
    subtitle.hidden = !subtitle.textContent;

    card.append(icon, title, subtitle);
    layer.appendChild(card);
    document.body.appendChild(layer);
    return { layer, card, icon, title, subtitle };
  }

  async function showTeamTurn(team, generation) {
    if (!['red', 'blue'].includes(team) || generation !== overlayGeneration) return;
    const overlay = createTurnOverlay(team, { title: teamTurnText(team) });
    sound('turnStart');
    requestAnimationFrame(() => overlay.layer.classList.add('show'));
    await wait(reducedMotion() ? 850 : 1450);
    if (generation !== overlayGeneration) { overlay.layer.remove(); return; }
    overlay.layer.classList.add('leave');
    await wait(reducedMotion() ? 30 : 260);
    overlay.layer.remove();
  }

  async function showWrongTurnTransition(fromTeam, toTeam, reason, generation) {
    if (!['red', 'blue'].includes(fromTeam) || !['red', 'blue'].includes(toTeam) || generation !== overlayGeneration) return;
    const overlay = createTurnOverlay(fromTeam, {
      transfer: true,
      wrong: true,
      fromTeam,
      toTeam,
      title: I.t('wrongPick'),
      subtitle: I.t('wrongTurnHandoff')
    });

    sound(reason === 'NEUTRAL_GUESS' ? 'neutral' : 'opponent');
    requestAnimationFrame(() => overlay.layer.classList.add('show'));
    await wait(reducedMotion() ? 520 : 760);
    if (generation !== overlayGeneration) { overlay.layer.remove(); return; }

    overlay.card.classList.add('handoff');
    overlay.layer.classList.remove(`team-${fromTeam}`);
    overlay.layer.classList.add(`team-${toTeam}`);
    overlay.icon.textContent = '↔';
    overlay.title.textContent = teamTurnText(toTeam);
    overlay.subtitle.textContent = '';
    overlay.subtitle.hidden = true;
    sound('turnStart');

    await wait(reducedMotion() ? 850 : 1250);
    if (generation !== overlayGeneration) { overlay.layer.remove(); return; }
    overlay.layer.classList.add('leave');
    await wait(reducedMotion() ? 30 : 260);
    overlay.layer.remove();
  }

  function flash(kind, text) {
    const root = document.getElementById('gameSection');
    if (!root) return;
    root.classList.remove('fx-correct','fx-neutral','fx-opponent','fx-assassin','fx-win');
    void root.offsetWidth;
    root.classList.add(`fx-${kind}`);
    setTimeout(() => root.classList.remove(`fx-${kind}`), kind === 'assassin' ? 900 : 650);
    if (text) {
      const banner = document.createElement('div');
      banner.className = `event-banner event-${kind}`;
      banner.textContent = text;
      document.body.appendChild(banner);
      requestAnimationFrame(() => banner.classList.add('show'));
      setTimeout(() => banner.classList.remove('show'), 1200);
      setTimeout(() => banner.remove(), 1550);
    }
  }

  function confetti() {
    if (reducedMotion()) return;
    const host = document.createElement('div');
    host.className = 'confetti-layer';
    for (let i=0; i<42; i += 1) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', `${Math.random()*100}vw`);
      piece.style.setProperty('--delay', `${Math.random()*.45}s`);
      piece.style.setProperty('--rot', `${Math.random()*720-360}deg`);
      host.appendChild(piece);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 2400);
  }

  function eventText(entry) {
    const p = entry.payload || {};
    if (entry.type === 'GAME_STARTED') return I.getLanguage() === 'ar' ? `بدأت اللعبة · ${I.t(p.startingTeam)}` : `Game started · ${I.t(p.startingTeam)}`;
    if (entry.type === 'TURN_STARTED') return teamTurnText(p.team);
    if (entry.type === 'TURN_ENDED') return I.t('turnEnded');
    if (entry.type === 'GAME_ENDED') return I.getLanguage() === 'ar' ? `فاز ${I.t(p.winner)}` : `${I.t(p.winner)} wins`;
    return '';
  }

  function processEvent(entry) {
    if (!entry) return;
    const p = entry.payload || {};

    if (entry.type === 'GAME_STARTED') {
      sound('gameStart');
      return;
    }

    if (entry.type === 'TURN_ENDED') {
      const isWrongGuess = p.reason === 'NEUTRAL_GUESS' || p.reason === 'OPPONENT_AGENT';
      if (isWrongGuess && p.team && p.nextTeam) {
        suppressTurnStartTeam = p.nextTeam;
        queueOverlay((generation) => showWrongTurnTransition(p.team, p.nextTeam, p.reason, generation));
      }
      return;
    }

    if (entry.type === 'TURN_STARTED') {
      if (suppressTurnStartTeam === p.team) {
        suppressTurnStartTeam = null;
        return;
      }
      queueOverlay((generation) => showTeamTurn(p.team, generation));
      return;
    }

    if (entry.type === 'CLUE_SUBMITTED') { sound('clue'); return; }
    if (entry.type === 'CLUE_CHALLENGED') { sound('challenge'); return; }

    if (entry.type === 'CARD_REVEALED') {
      if (p.role === 'assassin') { sound('assassin'); flash('assassin', I.t('assassinHit')); }
      else if (p.role === 'neutral') { flash('neutral'); }
      else if (p.role === p.guessingTeam) { sound('correct'); flash('correct'); }
      else { flash('opponent'); }
      return;
    }

    if (entry.type === 'GAME_ENDED') {
      const context = CN.UI && CN.UI.getOnlineContext ? CN.UI.getOnlineContext() : null;
      const ownTeam = context && context.player ? context.player.team : null;
      if (ownTeam === 'red' || ownTeam === 'blue') sound(ownTeam === p.winner ? 'win' : 'lose');
      else sound('win');
      flash('win', eventText(entry));
      confetti();
    }
  }

  function consumeLogs(state) {
    if (!state) return;
    const isNewRound = roundId !== state.roundId;
    if (isNewRound) {
      roundId = state.roundId;
      lastSeenKey = '';
      suppressTurnStartTeam = null;
      overlayGeneration += 1;
      overlayQueue = Promise.resolve();
      removeTurnOverlays();
    }
    const logs = Array.isArray(state.logs) ? state.logs : [];
    if (!logs.length) return;

    // A player joining an already-running online room must not replay every old animation.
    // اللاعب الذي يدخل غرفة جارية لا نعيد له كل إشعارات الجولات السابقة؛ نعرض الدور الحالي فقط.
    const onlineMode = CN.UI && CN.UI.getRuntimeMode && CN.UI.getRuntimeMode() === 'online';
    if (isNewRound && onlineMode && logs.length > 2) {
      const lastExisting = logs[logs.length - 1];
      lastSeenKey = `${lastExisting.timestamp}|${lastExisting.type}`;
      if (state.status !== 'ended' && ['red', 'blue'].includes(state.currentTeam)) {
        queueOverlay((generation) => showTeamTurn(state.currentTeam, generation));
      }
      return;
    }

    let start = 0;
    if (lastSeenKey) {
      const idx = logs.findIndex((e) => `${e.timestamp}|${e.type}` === lastSeenKey);
      if (idx >= 0) start = idx + 1;
    }
    logs.slice(start).forEach(processEvent);
    const last = logs[logs.length - 1];
    lastSeenKey = `${last.timestamp}|${last.type}`;
  }

  function updateControls() {
    const toggle = document.getElementById('soundToggleBtn');
    const slider = document.getElementById('soundVolume');
    if (toggle) {
      toggle.textContent = muted ? '🔇' : '🔊';
      toggle.title = muted ? I.t('soundOff') : I.t('soundOn');
      toggle.setAttribute('aria-label', muted ? I.t('soundOff') : I.t('soundOn'));
    }
    if (slider) slider.value = String(volume);
  }

  function init() {
    muted = safeStorageGet('cn-sound-muted') === '1';
    const savedVol = Number(safeStorageGet('cn-sound-volume'));
    if (Number.isFinite(savedVol) && savedVol >= 0 && savedVol <= 1) volume = savedVol;
    updateControls();
    const toggle = document.getElementById('soundToggleBtn');
    const slider = document.getElementById('soundVolume');
    if (toggle) toggle.addEventListener('click', () => { muted = !muted; safeStorageSet('cn-sound-muted', muted ? '1' : '0'); updateControls(); if (!muted) sound('click'); });
    if (slider) slider.addEventListener('input', () => { volume = Math.max(0, Math.min(1, Number(slider.value) || 0)); safeStorageSet('cn-sound-volume', String(volume)); if (volume > 0) { muted = false; safeStorageSet('cn-sound-muted','0'); } updateControls(); });
    document.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button:not(:disabled), select:not(:disabled)')) sound('click');
    }, { passive: true });
    if (G && G.subscribe) G.subscribe(consumeLogs);
  }

  CN.Effects = { init, sound, flash, confetti, updateControls };
})(window);
