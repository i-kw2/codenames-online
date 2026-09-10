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
      case 'neutral': tone(360,.1,'sine',.06); break;
      case 'assassin': tone(160,.24,'sawtooth',.11); tone(95,.34,'square',.08,.08); break;
      case 'win': tone(523,.1,'sine',.1); tone(659,.12,'sine',.1,.08); tone(784,.16,'sine',.12,.16); tone(1047,.24,'sine',.1,.25); break;
      case 'lose': tone(330,.11,'triangle',.08); tone(247,.14,'triangle',.08,.09); tone(196,.2,'sine',.08,.18); break;
      case 'challenge': tone(310,.09,'square',.06); tone(310,.09,'square',.06,.12); break;
      default: break;
    }
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
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    if (entry.type === 'TURN_STARTED') return I.getLanguage() === 'ar' ? `بدأ دور ${I.t(p.team)}` : `${I.t(p.team)} turn`; 
    if (entry.type === 'TURN_ENDED') return I.t('turnEnded');
    if (entry.type === 'GAME_ENDED') return I.getLanguage() === 'ar' ? `فاز ${I.t(p.winner)}` : `${I.t(p.winner)} wins`;
    return '';
  }

  function processEvent(entry) {
    if (!entry) return;
    const p = entry.payload || {};
    if (entry.type === 'GAME_STARTED') { sound('gameStart'); flash('correct', eventText(entry)); }
    else if (entry.type === 'TURN_STARTED') { setTimeout(() => { sound('turnStart'); flash('correct', eventText(entry)); }, 240); }
    else if (entry.type === 'TURN_ENDED') { sound('turnEnd'); flash('neutral', eventText(entry)); }
    else if (entry.type === 'CLUE_SUBMITTED') { sound('clue'); }
    else if (entry.type === 'CLUE_CHALLENGED') { sound('challenge'); }
    else if (entry.type === 'CARD_REVEALED') {
      if (p.role === 'assassin') { sound('assassin'); flash('assassin', I.t('assassinHit')); }
      else if (p.role === 'neutral') { sound('neutral'); flash('neutral'); }
      else if (p.role === p.guessingTeam) { sound('correct'); flash('correct'); }
      else { sound('opponent'); flash('opponent'); }
    } else if (entry.type === 'GAME_ENDED') {
      const context = CN.UI && CN.UI.getOnlineContext ? CN.UI.getOnlineContext() : null;
      const ownTeam = context && context.player ? context.player.team : null;
      if (ownTeam === 'red' || ownTeam === 'blue') sound(ownTeam === p.winner ? 'win' : 'lose');
      else sound('win');
      flash('win', eventText(entry)); confetti();
    }
  }

  function consumeLogs(state) {
    if (!state) return;
    if (roundId !== state.roundId) { roundId = state.roundId; lastSeenKey = ''; }
    const logs = Array.isArray(state.logs) ? state.logs : [];
    if (!logs.length) return;
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
