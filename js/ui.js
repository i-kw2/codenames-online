import { t, getLanguage } from './i18n.js';
import { CONFIG } from './config.js';

const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

const initials = name => (String(name || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0,2) || '?').toUpperCase();

export class UI {
  constructor(root) {
    this.root = root;
    this.toastTimer = null;
    this.lastKey = '';
  }

  render(app, game = null) {
    const screen = app.screen;
    if (screen === 'game' && game) return this.renderGame(app, game);
    this.lastKey = '';
    const map = {
      home: () => this.home(app), modes: () => this.modes(app), setup: () => this.setup(app), settings: () => this.settings(app),
      stats: () => this.stats(app), howto: () => this.howto(app), questions: () => this.questions(app), online: () => this.online(app)
    };
    this.root.innerHTML = (map[screen] || map.home)();
  }

  shell(content, { showBack = false, title = '' } = {}) {
    return `<main class="screen"><header class="topbar">${showBack ? `<button class="icon-btn" data-action="back" aria-label="${esc(t('back'))}">←</button>` : '<span></span>'}<div class="mini-title">${esc(title)}</div><button class="icon-btn" data-action="settings" aria-label="${esc(t('settings'))}">⚙</button></header>${content}</main>`;
  }

  home(app) {
    return `<main class="screen home-screen">
      <div class="stage-lights" aria-hidden="true"></div>
      <header class="home-top"><button class="profile-chip" data-action="stats"><span class="avatar">${esc(initials(app.settings.playerName))}</span><span>${esc(app.settings.playerName)}</span></button><button class="icon-btn" data-action="settings" aria-label="${esc(t('settings'))}">⚙</button></header>
      <section class="hero"><div class="logo-orbit" aria-hidden="true"></div><h1 class="game-logo">${esc(t('title'))}</h1><p>${esc(t('tagline'))}</p></section>
      <nav class="menu-stack" aria-label="Main menu">
        <button class="game-btn primary xl" data-action="play">${esc(t('play'))}</button>
        <div class="menu-grid"><button class="game-btn" data-action="howto">${esc(t('howToPlay'))}</button><button class="game-btn" data-action="questions">${esc(t('questionBank'))}</button><button class="game-btn" data-action="stats">${esc(t('profile'))}</button><button class="game-btn" data-action="settings">${esc(t('settings'))}</button></div>
      </nav>
      <footer class="home-footer"><button class="text-btn" data-action="toggle-language">🌐 ${getLanguage() === 'ar' ? 'العربية' : 'English'}</button><span>v1.0.0</span></footer>
    </main>`;
  }

  modes() {
    const cards = [
      ['classic-local','classic','local2','👥'], ['classic-ai','vsAI','vsAIDesc','🤖'], ['traditional','traditional','traditionalDesc','⚡'], ['fastmoney','fastMoney','fastMoneyDesc','⏱'], ['online','online','onlineDesc','🌐']
    ];
    return this.shell(`<section class="section-head"><h1>${esc(t('play'))}</h1><p>${esc(t('tagline'))}</p></section><section class="mode-grid">${cards.map(([mode,name,desc,icon]) => `<button class="mode-card" data-action="select-mode" data-mode="${mode}"><span class="mode-icon">${icon}</span><strong>${esc(t(name))}</strong><small>${esc(t(desc))}</small></button>`).join('')}</section>`, { showBack:true, title:t('play') });
  }

  setup(app) {
    const mode = app.selectedMode;
    const isAI = mode === 'classic-ai';
    const isTraditional = mode === 'traditional';
    return this.shell(`<section class="section-head"><h1>${esc(t('matchSetup'))}</h1><p>${esc(t(mode === 'fastmoney' ? 'fastMoneyDesc' : mode === 'traditional' ? 'traditionalDesc' : mode === 'classic-ai' ? 'vsAIDesc' : 'classicDesc'))}</p></section>
      <form class="setup-card" data-form="setup">
        <div class="player-setup"><span class="avatar big">1</span><label>${esc(isTraditional ? t('teamA') : t('player1'))}<input name="p1" maxlength="24" value="${esc(app.settings.playerName || t('player1'))}" required></label></div>
        <div class="versus">VS</div>
        <div class="player-setup"><span class="avatar big">2</span><label>${esc(isTraditional ? t('teamB') : t('player2'))}<input name="p2" maxlength="24" value="${esc(isAI ? 'AI' : (isTraditional ? t('teamB') : t('player2')))}" ${isAI ? 'readonly' : ''} required></label></div>
        ${mode !== 'fastmoney' ? `<label class="field">${esc(t('roundTime'))}<select name="roundTime">${[30,45,60,90].map(v=>`<option value="${v}" ${Number(app.settings.roundTime)===v?'selected':''}>${v} ${esc(t('seconds'))}</option>`).join('')}</select></label>` : ''}
        ${isAI ? `<label class="field">${esc(t('difficulty'))}<select name="difficulty">${['easy','medium','hard'].map(v=>`<option value="${v}" ${app.settings.aiDifficulty===v?'selected':''}>${esc(t(v))}</option>`).join('')}</select></label>` : ''}
        <button class="game-btn primary xl" type="submit">${esc(t('startMatch'))}</button>
      </form>`, { showBack:true, title:t('matchSetup') });
  }

  renderGame(app, s) {
    const signature = JSON.stringify({ lang:getLanguage(), vk:!!app.settings.virtualKeyboard, phase:s.phase, mode:s.mode, round:s.round, q:s.question?.id, active:s.activePlayer, scores:s.players.map(p=>p.score), revealed:[...s.revealedIds], strikes:s.strikes, pot:s.roundPot, fm:s.fastMoney ? [s.fastMoney.player,s.fastMoney.index] : null, winner:s.winner });
    if (this.lastKey === signature) { this.patchTimer(s.remainingTime); return; }
    this.lastKey = signature;
    this.virtualKeyboard = !!app.settings.virtualKeyboard;
    if (s.phase === 'round_intro') this.root.innerHTML = this.roundIntro(s);
    else if (s.phase === 'play_pass') this.root.innerHTML = this.playPass(s);
    else if (s.phase === 'round_result') this.root.innerHTML = this.roundResult(s);
    else if (s.phase === 'game_over') this.root.innerHTML = this.gameOver(s);
    else if (s.phase === 'fm_transition') this.root.innerHTML = this.fmTransition(s);
    else if (s.phase === 'fm_results') this.root.innerHTML = this.fmResults(s);
    else if (s.phase === 'paused') this.root.innerHTML = this.pauseScreen();
    else this.root.innerHTML = this.gameBoard(s);
  }

  hud(s) {
    const player = (p, i) => `<div class="hud-player ${s.activePlayer===i?'active':''}"><span class="avatar">${esc(initials(p.name))}</span><span class="hud-name">${esc(p.name)}</span><strong class="hud-score" id="score-${i}">${p.score}</strong></div>`;
    return `<div class="hud">${player(s.players[0],0)}<div class="timer ${s.remainingTime<=5?'danger':s.remainingTime<=10?'warning':''}"><small>${esc(t('time'))}</small><strong id="timer-value">${s.remainingTime}</strong></div>${player(s.players[1],1)}</div>`;
  }

  board(s, revealAll = false) {
    if (!s.question) return '';
    const lang = getLanguage();
    return `<div class="answer-board" style="--answers:${s.question.answers.length}">${s.question.answers.map((a,i)=>{
      const shown = revealAll || s.revealedIds.has(a.id);
      return `<div class="answer-tile ${shown?'revealed':'hidden'}" data-answer-id="${esc(a.id)}">${shown ? `<span class="answer-text">${esc(a.text[lang])}</span><strong>${a.points}</strong>` : `<span class="answer-rank">${i+1}</span>`}</div>`;
    }).join('')}</div>`;
  }

  gameBoard(s) {
    const lang = getLanguage();
    const isTraditional = s.mode === 'traditional';
    const isFM = s.mode === 'fastmoney';
    const disabled = s.mode === 'classic-ai' && s.activePlayer === 1;
    const stateTitle = isTraditional && s.phase.startsWith('faceoff') ? t('faceOff') : isTraditional && s.phase==='steal' ? t('steal') : isFM ? t('fastMoney') : s.suddenDeath ? t('suddenDeath') : `${t('round')} ${s.round+1}`;
    const sub = isTraditional && s.phase === 'faceoff_a' ? t('faceOffPrompt',{team:s.players[0].name}) : isTraditional && s.phase === 'faceoff_b' ? t('faceOffPrompt',{team:s.players[1].name}) : isTraditional && s.phase === 'steal' ? t('stealPrompt') : isFM ? t('fmQuestion',{current:s.fastMoney.index+1,total:CONFIG.FAST_MONEY_QUESTIONS}) : t('turn',{name:s.players[s.activePlayer].name});
    return `<main class="screen game-screen">${this.hud(s)}<header class="game-brand"><button class="icon-btn" data-action="pause" aria-label="${esc(t('pause'))}">Ⅱ</button><h1>${esc(t('title'))}</h1><button class="icon-btn" data-action="toggle-language" aria-label="${esc(t('language'))}">🌐</button></header><section class="game-stage">
      <div class="round-label">${esc(stateTitle)} · ${esc(sub)}</div>
      <article class="question-card"><small>${esc(t('question'))}</small><h2>${esc(s.question?.question?.[lang] || '')}</h2></article>
      ${isFM ? `<div class="fm-progress">${Array.from({length:5},(_,i)=>`<span class="${i<s.fastMoney.index?'done':i===s.fastMoney.index?'current':''}"></span>`).join('')}</div>` : this.board(s)}
      ${isTraditional ? `<div class="traditional-status"><span>${esc(t('roundPot'))}: <strong>${s.roundPot}</strong></span><span>${esc(t('strikes'))}: <strong class="strike-text">${'✕'.repeat(s.strikes)}${'○'.repeat(Math.max(0,3-s.strikes))}</strong></span></div>` : ''}
      <div id="feedback-zone" class="feedback-zone" aria-live="polite"></div>
      <form class="answer-bar" data-form="answer"><input id="answer-input" name="answer" autocomplete="off" maxlength="60" placeholder="${esc(disabled?t('aiThinking'):t('typeAnswer'))}" ${disabled?'disabled':''} dir="auto"><button class="game-btn primary" type="submit" ${disabled?'disabled':''}>${esc(t('submit'))}</button></form>
      ${this.virtualKeyboard && !disabled ? this.keyboard() : ''}
    </section></main>`;
  }


  keyboard() {
    const lang = getLanguage();
    const keys = lang === 'ar'
      ? ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','د','ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط','ئ','ء','ؤ','ر','ى','ة','و','ز','ظ']
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return `<div class="virtual-keyboard">${keys.map(k=>`<button type="button" data-action="vk-key" data-key="${esc(k)}">${esc(k)}</button>`).join('')}<button type="button" class="wide" data-action="vk-key" data-key="space">␠</button><button type="button" data-action="vk-key" data-key="backspace">⌫</button></div>`;
  }

  roundIntro(s) {
    const multiplier = s.mode === 'traditional' ? CONFIG.TRADITIONAL_ROUND_MULTIPLIERS[s.round] || 1 : 1;
    return `<main class="screen center-screen"><div class="round-intro"><small>${esc(t('title'))}</small><h1>${s.suddenDeath?esc(t('suddenDeath')):`${esc(t('round'))} ${s.round+1}`}</h1>${s.mode==='traditional'?`<p>×${multiplier}</p>`:''}</div></main>`;
  }

  playPass(s) {
    return `<main class="screen center-screen"><section class="dialog-card"><h1>${esc(t('faceOff'))}</h1><p>${esc(s.players[s.controller].name)}</p><h2>${esc(t('choosePlayPass'))}</h2><div class="button-row"><button class="game-btn primary xl" data-action="play-pass" data-choice="play">${esc(t('playChoice'))}</button><button class="game-btn xl" data-action="play-pass" data-choice="pass">${esc(t('passChoice'))}</button></div></section></main>`;
  }

  roundResult(s) {
    const hist = s.roundHistory.at(-1);
    return `<main class="screen result-screen"><section class="dialog-card wide"><h1>${esc(t('roundComplete'))}</h1>${this.board(s,true)}<div class="score-vs"><div><span>${esc(s.players[0].name)}</span><strong>+${hist?.scores?.[0]??0}</strong><small>${s.players[0].score}</small></div><div>VS</div><div><span>${esc(s.players[1].name)}</span><strong>+${hist?.scores?.[1]??0}</strong><small>${s.players[1].score}</small></div></div><button class="game-btn primary xl" data-action="next-round">${s.round+1>=s.maxRounds?esc(t('results')):esc(t('nextRound'))}</button></section></main>`;
  }

  gameOver(s) {
    const winnerText = s.winner == null ? t('tie') : s.players[s.winner].name;
    return `<main class="screen winner-screen"><div class="confetti" aria-hidden="true"></div><section class="dialog-card wide"><div class="trophy">🏆</div><h1>${esc(s.winner==null?t('tie'):t('winner'))}</h1><h2>${esc(winnerText)}</h2><div class="final-scores"><strong>${esc(s.players[0].name)} ${s.players[0].score}</strong><span>—</span><strong>${esc(s.players[1].name)} ${s.players[1].score}</strong></div><div class="button-row"><button class="game-btn primary" data-action="rematch">${esc(t('rematch'))}</button><button class="game-btn" data-action="home">${esc(t('home'))}</button></div></section></main>`;
  }

  fmTransition(s) {
    return `<main class="screen center-screen"><section class="dialog-card"><h1>${esc(t('fmPlayerComplete'))}</h1><p>${esc(t('passDevice'))}</p><button class="game-btn primary xl" data-action="fm-player2">${esc(t('ready'))}</button></section></main>`;
  }

  fmResults(s) {
    const fm = s.fastMoney;
    const totals = fm.responses.map(rows => rows.reduce((sum,r)=>sum+(r?.points||0),0));
    return `<main class="screen result-screen"><section class="dialog-card wide"><h1>${esc(t('fastMoney'))} · ${esc(t('results'))}</h1><div class="fm-table"><div class="fm-head">${esc(s.players[0].name)}</div><div class="fm-head">${esc(s.players[1].name)}</div>${Array.from({length:5},(_,i)=>`<div class="fm-cell"><span>${esc(fm.responses[0][i]?.display || '—')}</span><strong>${fm.responses[0][i]?.points||0}</strong></div><div class="fm-cell"><span>${esc(fm.responses[1][i]?.display || '—')}</span><strong>${fm.responses[1][i]?.points||0}</strong></div>`).join('')}<div class="fm-total">${esc(t('total'))}: ${totals[0]}</div><div class="fm-total">${esc(t('total'))}: ${totals[1]}</div></div>${totals[0]+totals[1]>=CONFIG.FAST_MONEY_BONUS_TARGET?`<div class="bonus-banner">✨ ${esc(t('bonus200'))}</div>`:''}<button class="game-btn primary xl" data-action="fm-finish">${esc(t('continue'))}</button></section></main>`;
  }

  pauseScreen() {
    return `<main class="screen center-screen"><section class="dialog-card"><h1>${esc(t('pause'))}</h1><button class="game-btn primary xl" data-action="resume">${esc(t('resume'))}</button><button class="game-btn" data-action="quit-match">${esc(t('quit'))}</button></section></main>`;
  }

  settings(app) {
    const s = app.settings;
    return this.shell(`<section class="section-head"><h1>${esc(t('settings'))}</h1></section><form class="settings-panel" data-form="settings">
      <label class="setting-row"><span>${esc(t('language'))}</span><select name="language"><option value="en" ${s.language==='en'?'selected':''}>English</option><option value="ar" ${s.language==='ar'?'selected':''}>العربية</option></select></label>
      <label class="setting-row"><span>${esc(t('sound'))}</span><input type="checkbox" name="sound" ${s.sound?'checked':''}></label>
      <label class="setting-row"><span>${esc(t('virtualKeyboard'))}</span><input type="checkbox" name="virtualKeyboard" ${s.virtualKeyboard?'checked':''}></label>
      <label class="setting-row"><span>${esc(t('reducedMotion'))}</span><input type="checkbox" name="reducedMotion" ${s.reducedMotion?'checked':''}></label>
      <label class="setting-row"><span>${esc(t('roundTime'))}</span><select name="roundTime">${[30,45,60,90].map(v=>`<option value="${v}" ${Number(s.roundTime)===v?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="setting-row"><span>${esc(t('difficulty'))}</span><select name="aiDifficulty">${['easy','medium','hard'].map(v=>`<option value="${v}" ${s.aiDifficulty===v?'selected':''}>${esc(t(v))}</option>`).join('')}</select></label>
      <button class="game-btn primary" type="submit">${esc(t('save'))}</button><button class="game-btn danger" type="button" data-action="reset-stats">${esc(t('resetStats'))}</button></form>`, { showBack:true, title:t('settings') });
  }

  stats(app) {
    const s = app.stats; const avg = s.gamesPlayed ? Math.round(s.totalScore/s.gamesPlayed) : 0;
    const cards = [[t('gamesPlayed'),s.gamesPlayed],[t('wins'),s.wins],[t('losses'),s.losses],[t('highestScore'),s.highestScore],[t('averageScore'),avg],[t('correctGuesses'),s.correct],[t('wrongGuesses'),s.wrong]];
    return this.shell(`<section class="section-head"><h1>${esc(t('profile'))}</h1></section><section class="stats-grid">${cards.map(([k,v])=>`<article class="stat-card"><span>${esc(k)}</span><strong>${v}</strong></article>`).join('')}</section>`, { showBack:true, title:t('profile') });
  }

  howto() {
    return this.shell(`<section class="section-head"><h1>${esc(t('howToPlay'))}</h1></section><section class="how-grid"><article><h2>${esc(t('classic'))}</h2><p>${esc(t('howClassic'))}</p></article><article><h2>${esc(t('traditional'))}</h2><p>${esc(t('howTraditional'))}</p></article><article><h2>${esc(t('fastMoney'))}</h2><p>${esc(t('howFast'))}</p></article><article><h2>${esc(t('online'))}</h2><p>${esc(t('howOnline'))}</p></article></section>`, { showBack:true, title:t('howToPlay') });
  }

  questions(app) {
    const lang = getLanguage();
    const categories = [...new Set(app.allQuestions.map(q=>q.category))].sort();
    const filter = app.questionFilter || { search:'', category:'' };
    const filtered = app.allQuestions.filter(q => (!filter.category || q.category===filter.category) && (!filter.search || `${q.id} ${q.category} ${q.question.en} ${q.question.ar}`.toLowerCase().includes(filter.search.toLowerCase())));
    return this.shell(`<section class="section-head"><h1>${esc(t('questionBank'))}</h1><p>${app.allQuestions.length} · ${esc(t('valid'))}</p></section><section class="qb-toolbar"><input id="qb-search" value="${esc(filter.search)}" placeholder="${esc(t('qbSearch'))}"><select id="qb-category"><option value="">${esc(t('allCategories'))}</option>${categories.map(c=>`<option value="${esc(c)}" ${filter.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select><button class="game-btn primary" data-action="add-question">+ ${esc(t('addQuestion'))}</button><button class="game-btn" data-action="import-json">${esc(t('importJSON'))}</button><button class="game-btn" data-action="export-json">${esc(t('exportJSON'))}</button></section><section class="question-list">${filtered.length?filtered.map(q=>`<article class="question-item"><div><small>${esc(q.category)} · ${app.customQuestionIds.has(q.id)?esc(t('custom')):esc(t('builtIn'))}</small><h3>${esc(q.question[lang])}</h3><p>${q.answers.length} ${esc(t('answers'))}</p></div><div class="item-actions">${app.customQuestionIds.has(q.id)?`<button class="icon-btn" data-action="edit-question" data-id="${esc(q.id)}">✎</button><button class="icon-btn danger" data-action="delete-question" data-id="${esc(q.id)}">🗑</button>`:`<button class="icon-btn" data-action="duplicate-question" data-id="${esc(q.id)}">⧉</button>`}</div></article>`).join(''):`<div class="empty-state">${esc(t('noQuestions'))}</div>`}</section>`, { showBack:true, title:t('questionBank') });
  }

  online(app) {
    const o = app.online || { status:'idle' };
    if (o.status === 'room') return this.shell(`<section class="section-head"><h1>${esc(t('online'))}</h1></section><section class="dialog-card"><small>${esc(t('roomCode'))}</small><div class="room-code" dir="ltr">${esc(o.roomCode)}</div><div class="button-row"><button class="game-btn" data-action="copy-room">${esc(t('copyCode'))}</button><button class="game-btn" data-action="copy-link">${esc(t('copyLink'))}</button></div><div class="lobby-list">${(o.players||[]).map(p=>`<div class="lobby-player"><span class="avatar">${esc(initials(p.name))}</span><strong>${esc(p.name)}</strong><span>● ${esc(t('connected'))}</span></div>`).join('')}${(o.players||[]).length<2?`<p>${esc(t('waitingOpponent'))}</p>`:''}</div>${o.isHost?`<button class="game-btn primary xl" data-action="start-online" ${(o.players||[]).length<2?'disabled':''}>${esc(t('startOnline'))}</button>`:''}<button class="game-btn danger" data-action="leave-room">${esc(t('leaveRoom'))}</button></section>`, { showBack:true, title:t('online') });
    return this.shell(`<section class="section-head"><h1>${esc(t('online'))}</h1></section><section class="online-grid"><button class="mode-card" data-action="create-room"><span class="mode-icon">＋</span><strong>${esc(t('createRoom'))}</strong></button><form class="mode-card join-card" data-form="join-room"><span class="mode-icon">⌨</span><strong>${esc(t('joinRoom'))}</strong><input name="roomCode" maxlength="6" dir="ltr" value="${esc(app.online?.prefillRoom || '')}" placeholder="A7K9Q2" required><input name="name" maxlength="24" value="${esc(app.settings.playerName)}" required><button class="game-btn primary" type="submit">${esc(t('joinRoom'))}</button></form></section>`, { showBack:true, title:t('online') });
  }

  patchTimer(value) {
    const el = document.getElementById('timer-value');
    if (!el) return;
    el.textContent = value;
    const box = el.closest('.timer');
    box?.classList.toggle('warning', value<=10 && value>5);
    box?.classList.toggle('danger', value<=5);
  }

  feedback(type, payload = {}) {
    const zone = document.getElementById('feedback-zone');
    if (!zone) return;
    const map = { correct:'correct', wrong:'wrong', duplicate:'duplicate', empty:'empty', strike:'wrong', tryAnother:'tryAnother', aiThinking:'aiThinking', stealSuccess:'stealSuccess', stealFailed:'stealFailed' };
    let text = t(map[type] || type);
    if (type === 'correct' && payload.answer) text += ` +${payload.answer.points}`;
    if (type === 'wrong' && payload.penalty) text += ` -${payload.penalty}`;
    if (type === 'strike') text += ` ${'✕'.repeat(payload.strikes||1)}`;
    if (type === 'correct' && payload.top) text = `${t('topAnswer')} +${payload.answer.points}`;
    zone.textContent = text;
    zone.className = `feedback-zone show ${type}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(()=>{ zone.className='feedback-zone'; zone.textContent=''; }, 1200);
  }

  toast(message, kind='info') {
    let toast = document.getElementById('global-toast');
    if (!toast) { toast=document.createElement('div'); toast.id='global-toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.className = `global-toast show ${kind}`;
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>toast.className='global-toast',2200);
  }

  showQuestionEditor(question = null) {
    const q = question || { id:`custom_${Date.now()}`, category:'custom', question:{en:'',ar:''}, answers:[0,1,2].map(i=>({id:`a${i+1}`,text:{en:'',ar:''},points:10,aliases:{en:[],ar:[]}})) };
    const modal = document.getElementById('modal-root');
    modal.innerHTML = `<div class="modal-backdrop" data-action="modal-close"><section class="modal-card" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><h2>${esc(t('editorTitle'))}</h2><form data-form="question-editor"><input type="hidden" name="originalId" value="${esc(question?.id||'')}"><div class="form-grid"><label>${esc(t('questionId'))}<input name="id" value="${esc(q.id)}" required></label><label>${esc(t('category'))}<input name="category" value="${esc(q.category)}" required></label><label class="span2">${esc(t('englishQuestion'))}<textarea name="qEn" required>${esc(q.question.en)}</textarea></label><label class="span2">${esc(t('arabicQuestion'))}<textarea name="qAr" required dir="rtl">${esc(q.question.ar)}</textarea></label></div><div id="editor-answers">${q.answers.map((a,i)=>this.answerEditorRow(a,i)).join('')}</div><button type="button" class="game-btn" data-action="editor-add-answer">+ ${esc(t('addAnswer'))}</button><div class="modal-actions"><button type="button" class="game-btn" data-action="modal-close">${esc(t('cancel'))}</button><button class="game-btn primary" type="submit">${esc(t('save'))}</button></div></form></section></div>`;
  }

  answerEditorRow(a,i) {
    return `<fieldset class="answer-editor" data-answer-row><legend>${esc(t('answers'))} ${i+1}</legend><label>${esc(t('englishAnswer'))}<input name="aEn" value="${esc(a.text?.en||'')}" required></label><label>${esc(t('arabicAnswer'))}<input name="aAr" value="${esc(a.text?.ar||'')}" required dir="rtl"></label><label>${esc(t('points'))}<input name="aPoints" type="number" min="0" max="100" value="${Number(a.points)||0}" required></label><label>${esc(t('aliasesEn'))}<input name="aAliasesEn" value="${esc((a.aliases?.en||[]).filter(x=>x!==a.text?.en).join(', '))}"></label><label>${esc(t('aliasesAr'))}<input name="aAliasesAr" value="${esc((a.aliases?.ar||[]).filter(x=>x!==a.text?.ar).join(', '))}" dir="rtl"></label><button type="button" class="icon-btn danger" data-action="editor-delete-answer">×</button></fieldset>`;
  }

  showImport() {
    const modal = document.getElementById('modal-root');
    modal.innerHTML = `<div class="modal-backdrop" data-action="modal-close"><section class="modal-card" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><h2>${esc(t('importTitle'))}</h2><p>${esc(t('importHelp'))}</p><form data-form="import-json"><textarea name="json" class="json-area" dir="ltr" required>[\n\n]</textarea><div class="modal-actions"><button type="button" class="game-btn" data-action="modal-close">${esc(t('cancel'))}</button><button class="game-btn primary" type="submit">${esc(t('import'))}</button></div></form></section></div>`;
  }

  closeModal() { document.getElementById('modal-root').innerHTML=''; }
}
