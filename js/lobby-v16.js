(function (global) {
  'use strict';

  const AVATARS = [
    '001_NN_Man.png','002_NN_Man.png','003_NN_Man.png','004_NN_Man.png','005_NN_Man.png',
    '006_NN_Woman.png','007_NN_Woman.png','008_NN_Woman.png','009_NN_Woman.png','010_NN_Woman.png',
    '011_NN_Animal.png','012_NN_Animal.png','013_NN_Animal.png','014_NN_Animal.png','015_NN_Animal.png',
    '016_NN_Kids.png','017_NN_Kids.png','018_NN_Kids.png','019_NN_Kids.png','020_NN_Kids.png',
    '021_NN_Maid.png','022_NN_Maid.png','023_NN_Maid.png','024_NN_Maid.png','025_NN_Maid.png'
  ];

  const refs = {};
  let context = { inRoom: false, roomStatus: null, isHost: false, uid: null, player: null, players: [], roomSettings: {} };
  let activeSettingsTab = 'player';
  let initialized = false;

  const strings = {
    en: {
      admin:'Admin', news:'News', rules:'Rules', settings:'Settings', spectators:'Spectators', quick:'Show quick guide',
      blueTeam:'BLUE TEAM', redTeam:'RED TEAM', operatives:'OPERATIVES', spymaster:'SPYMASTER', join:'JOIN TEAM', leaveTeam:'LEAVE TEAM', taken:'SPYMASTER TAKEN', locked:'TEAMS LOCKED',
      gameSettings:'GAME SETTINGS', classic:'CLASSIC', players4:'4+ PLAYERS', wordLang:'WORD PACKS & LANGUAGE', timer:'TIMER', off:'OFF', reset:'Reset teams', random:'Randomize teams', start:'START GAME', waiting:'WAITING FOR HOST',
      setupTitle:'SET UP THE MATCH', hostGuide:'As host, choose the settings, join a role or stay spectator, then press Start game to play.', playerGuide:'Choose a team and role, or stay spectator, then wait for the host to start the game.', gotIt:'GOT IT', auto:'Auto-show'
    },
    ar: {
      admin:'الإدارة', news:'الأخبار', rules:'القواعد', settings:'الإعدادات', spectators:'المشاهدون', quick:'عرض الدليل السريع',
      blueTeam:'الفريق الأزرق', redTeam:'الفريق الأحمر', operatives:'اللاعبون', spymaster:'قائد التجسس', join:'انضم للفريق', leaveTeam:'غادر الفريق', taken:'الدور محجوز', locked:'الفرق مقفلة',
      gameSettings:'إعدادات اللعبة', classic:'كلاسيك', players4:'4+ لاعبين', wordLang:'حزم الكلمات واللغة', timer:'المؤقت', off:'متوقف', reset:'إعادة الفرق', random:'توزيع الفرق عشوائياً', start:'ابدأ اللعبة', waiting:'بانتظار المضيف',
      setupTitle:'جهّز المباراة', hostGuide:'بصفتك مدير الغرفة، اختر إعدادات المباراة، ثم انضم إلى دور أو ابقَ مشاهدًا، وبعدها اضغط ابدأ اللعبة.', playerGuide:'اختر فريقًا ودورًا أو ابقَ مشاهدًا، ثم انتظر مدير الغرفة ليبدأ المباراة.', gotIt:'فهمت', auto:'إظهار تلقائي'
    }
  };

  function safeGet(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* optional */ } }
  function boolPref(key, fallback) { const v = safeGet(key, fallback ? '1' : '0'); return v === '1'; }
  function lang() { return global.Codenames && global.Codenames.I18n ? global.Codenames.I18n.getLanguage() : 'en'; }
  function t(key) { const l = lang() === 'ar' ? 'ar' : 'en'; return strings[l][key] || strings.en[key] || key; }

  function avatarIdFor(player) {
    const explicit = Number(player && player.avatarId);
    if (Number.isInteger(explicit) && explicit >= 1 && explicit <= 25) return explicit;
    const seed = String((player && (player.uid || player.id || player.name)) || 'player');
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    return Math.abs(hash) % 25 + 1;
  }
  function avatarSrc(player) { return `assets/cards/${AVATARS[avatarIdFor(player)-1]}`; }

  function cache() {
    [
      'roomTopNav','roomAdminBtn','roomNavPlayerCount','roomNewsBtn','roomRulesBtn','roomSettingsBtn','spectatorsTitle','spectatorLobbyList',
      'quickGuideBtn','quickGuidePopover','quickGuideCloseBtn','quickGuideTitle','quickGuideText','quickGuideGotItBtn','quickGuideRulesBtn','quickGuideAutoShow',
      'blueOperativesList','blueSpymasterList','redOperativesList','redSpymasterList','gameSettingsTitle','wordLanguageRow','wordLanguageSummary','resetTeamsBtn','onlineRandomTeamsBtn','onlineStartGameBtn','lobbyValidationMessage',
      'roomSettingsDialog','roomSettingsCloseBtn','settingsPlayersList','settingsLockTeams','settingsResetTeamsBtn','settingsRandomTeamsBtn','settingsCardLanguage','settingsStrictClues','settingsExpertRules','settingsCopyInviteBtn',
      'settingsAvatarPreview','settingsNickname','settingsAvatarSelect','settingsLeaveMatchBtn','prefUiLanguage','prefMusicVolume','prefEffectsVolume','prefAlwaysGuess','prefHideRoomUrl','prefShowHintsBtn',
      'a11yColorblind','a11ySeasonal','a11yStaticBackground','a11yDisableAnimations','motionSystemNote','rulesDialogV14','rulesCloseBtnV14','newsDialogV14','newsCloseBtnV14'
    ].forEach((id) => { refs[id] = document.getElementById(id); });
  }

  function makeMini(player, current) {
    const item = document.createElement('div');
    item.className = `player-mini${player.online === false ? ' offline' : ''}${current ? ' current' : ''}`;
    item.setAttribute('aria-label', `${player.name || 'Player'}, ${player.role || 'spectator'}${player.isHost ? ', room admin' : ''}`);
    if (player.isHost) {
      const crown = document.createElement('span'); crown.className = 'player-mini-crown'; crown.textContent = '👑'; crown.setAttribute('aria-hidden','true'); item.appendChild(crown);
    }
    const img = document.createElement('img'); img.className = 'player-mini-avatar'; img.src = avatarSrc(player); img.alt = ''; img.loading = 'lazy';
    const name = document.createElement('span'); name.className = 'player-mini-name'; name.textContent = player.name || 'Player';
    item.append(img,name);
    return item;
  }

  function players() { return Array.isArray(context.players) ? context.players : Object.values(context.players || {}); }
  function isSpectator(p) { return !p || p.team === 'spectator' || p.team === 'unassigned' || p.role === 'spectator'; }

  function fillList(node, list) {
    if (!node) return;
    node.replaceChildren();
    list.forEach((p) => node.appendChild(makeMini(p, p.uid === context.uid)));
  }

  function validateLobby() {
    const active = players().filter((p) => p.online !== false && !isSpectator(p) && ['red','blue'].includes(p.team));
    const red = active.filter((p) => p.team === 'red');
    const blue = active.filter((p) => p.team === 'blue');
    const redSpies = red.filter((p) => p.role === 'spymaster').length;
    const blueSpies = blue.filter((p) => p.role === 'spymaster').length;
    const errors = [];
    if (active.length < 4) errors.push(lang()==='ar' ? 'تحتاج 4 لاعبين متصلين ونشطين على الأقل.' : 'Need at least 4 connected active players.');
    if (red.length < 2 || blue.length < 2) errors.push(lang()==='ar' ? 'كل فريق يحتاج لاعبين على الأقل.' : 'Each team needs at least 2 players.');
    if (redSpies !== 1 || blueSpies !== 1) errors.push(lang()==='ar' ? 'يجب أن يكون لكل فريق قائد تجسس واحد.' : 'Each team needs exactly one Spymaster.');
    return { valid: errors.length === 0, errors };
  }

  function translateLobbyShell() {
    if (!refs.roomTopNav) return;
    const adminLabel = refs.roomAdminBtn && refs.roomAdminBtn.querySelector('span:first-child'); if (adminLabel) adminLabel.textContent = t('admin');
    if (refs.roomNewsBtn) refs.roomNewsBtn.textContent = t('news');
    if (refs.roomRulesBtn) refs.roomRulesBtn.textContent = t('rules');
    if (refs.roomSettingsBtn) refs.roomSettingsBtn.innerHTML = `<span aria-hidden="true">⚙</span> ${t('settings')}`;
    if (refs.spectatorsTitle) refs.spectatorsTitle.innerHTML = `${t('spectators')} <span aria-hidden="true">👁</span>`;
    const qLabel = document.querySelector('.quick-guide-label'); if (qLabel) qLabel.textContent = t('quick');
    document.querySelectorAll('.team-blue .team-header').forEach((n)=>n.textContent=t('blueTeam'));
    document.querySelectorAll('.team-red .team-header').forEach((n)=>n.textContent=t('redTeam'));
    document.querySelectorAll('.role-operative > h3').forEach((n)=>n.textContent=t('operatives'));
    document.querySelectorAll('.role-spymaster > h3').forEach((n)=>n.textContent=t('spymaster'));
    if (refs.gameSettingsTitle) refs.gameSettingsTitle.textContent=t('gameSettings');
    const mode = document.querySelector('.mode-selected'); if (mode) { const st=mode.querySelector('strong'), sm=mode.querySelector('small'); if(st)st.textContent=t('classic'); if(sm)sm.textContent=t('players4'); }
    const wordRow = document.getElementById('wordLanguageRow'); if(wordRow){ const st=wordRow.querySelector('strong'); if(st)st.textContent=t('wordLang'); }
    const timer = document.querySelector('.timer-display'); if(timer){ const st=timer.querySelector('strong'), sm=timer.querySelector('small'); if(st)st.textContent=t('timer'); if(sm)sm.textContent=t('off'); }
    if(refs.resetTeamsBtn) refs.resetTeamsBtn.textContent=t('reset');
    if(refs.onlineRandomTeamsBtn) refs.onlineRandomTeamsBtn.textContent=t('random');
    translateSecondaryUi();
  }

  function setText(selector, value) { const n=document.querySelector(selector); if(n) n.textContent=value; }
  function translateSecondaryUi() {
    const ar=lang()==='ar';
    const q=(en,arText)=>ar?arText:en;
    setText('[data-settings-tab="admin"]',q('Admin','الإدارة'));
    setText('[data-settings-tab="player"]',q('Player','اللاعب'));
    setText('[data-settings-tab="preferences"]',q('Preferences','التفضيلات'));
    setText('[data-settings-tab="accessibility"]',q('Accessibility','إمكانية الوصول'));
    setText('[data-settings-panel="admin"] > h2',q('Admin','الإدارة'));
    setText('[data-settings-panel="admin"] .settings-dark-section h3',q('Players in the room','اللاعبون في الغرفة'));
    const lock=document.querySelector('[data-settings-panel="admin"] .settings-line span'); if(lock){const st=lock.querySelector('strong'),sm=lock.querySelector('small'); if(st)st.textContent=q('Lock teams','قفل الفرق'); if(sm)sm.textContent=q('Prevent players from changing teams or roles.','منع اللاعبين من تغيير الفريق أو الدور.');}
    if(refs.settingsResetTeamsBtn)refs.settingsResetTeamsBtn.textContent=q('Reset teams','إعادة الفرق');
    if(refs.settingsRandomTeamsBtn)refs.settingsRandomTeamsBtn.textContent=q('Randomize teams','توزيع الفرق عشوائياً');
    const adminFields=document.querySelectorAll('[data-settings-panel="admin"] .settings-dark-section.compact .settings-field > span, [data-settings-panel="admin"] .settings-dark-section.compact .settings-line > span');
    ['Card language','Strict clues','Expert rules (0 / Unlimited)'].forEach((v,i)=>{if(adminFields[i])adminFields[i].textContent=q(v,['لغة البطاقات','تلميحات صارمة','قواعد الخبراء (0 / Unlimited)'][i]);});
    if(refs.settingsCopyInviteBtn && !/Copied|تم النسخ/.test(refs.settingsCopyInviteBtn.textContent))refs.settingsCopyInviteBtn.textContent=q('Copy Invite Link','نسخ رابط الدعوة');
    setText('[data-settings-panel="player"] > h2',q('Player','اللاعب'));
    const pf=document.querySelectorAll('[data-settings-panel="player"] .settings-field > span'); if(pf[0])pf[0].textContent=q('Nickname','الاسم'); if(pf[1])pf[1].textContent=q('Avatar','الصورة');
    setText('[data-settings-panel="player"] .settings-dark-section h3',q('Assign role','تعيين الدور'));
    const roles=document.querySelectorAll('[data-assign-team][data-assign-role]'); const rt=ar?['لاعبو الأزرق','لاعبو الأحمر','قائد الأزرق','قائد الأحمر','المشاهدون']:['Blue operatives','Red operatives','Blue spymaster','Red spymaster','Spectators']; roles.forEach((b,i)=>{if(rt[i])b.textContent=rt[i];});
    if(refs.settingsLeaveMatchBtn)refs.settingsLeaveMatchBtn.textContent=q('Leave match','مغادرة المباراة');
    setText('[data-settings-panel="preferences"] > h2',q('Preferences','التفضيلات'));
    const prefField=document.querySelector('[data-settings-panel="preferences"] .settings-field > span'); if(prefField)prefField.textContent=q('Selected website language','لغة الموقع المختارة');
    const prefChoices=document.querySelectorAll('[data-settings-panel="preferences"] .settings-choice-group > span'); if(prefChoices[0])prefChoices[0].textContent=q('Dark mode','الوضع الداكن');
    setText('[data-settings-panel="preferences"] .settings-dark-section h3',q('Sounds','الأصوات'));
    const sliders=document.querySelectorAll('[data-settings-panel="preferences"] .slider-line > span'); if(sliders[0])sliders[0].textContent=q('Music','الموسيقى'); if(sliders[1])sliders[1].textContent=q('Effects','المؤثرات');
    const prefLines=document.querySelectorAll('[data-settings-panel="preferences"] .settings-line > span'); if(prefLines[0])prefLines[0].textContent=q('Always show card guess button','إظهار زر التخمين دائماً'); if(prefLines[1])prefLines[1].textContent=q('Hide room URL in address bar','إخفاء رابط الغرفة من شريط العنوان');
    const hints=document.querySelector('[data-settings-panel="preferences"] .settings-line:last-child > span'); if(hints){const st=hints.querySelector('strong'),sm=hints.querySelector('small'); if(st)st.textContent=q('Show all hints again','إظهار كل الإرشادات مرة أخرى'); if(sm)sm.textContent=q('Reset the Quick Guide hints you have acknowledged.','إعادة الإرشادات السريعة التي سبق أن قرأتها.');}
    if(refs.prefShowHintsBtn)refs.prefShowHintsBtn.textContent=q('Show','إظهار');
    setText('[data-settings-panel="accessibility"] > h2',q('Accessibility','إمكانية الوصول'));
    const aChoice=document.querySelector('[data-settings-panel="accessibility"] .settings-choice-group > span'); if(aChoice)aChoice.textContent=q('Text size','حجم النص');
    const aLines=document.querySelectorAll('[data-settings-panel="accessibility"] > .settings-line > span'); if(aLines[0])aLines[0].textContent=q('Show colorblind assistive symbols on cards','إظهار رموز مساعدة لعمى الألوان على البطاقات'); if(aLines[1])aLines[1].textContent=q('Disable seasonal themes','تعطيل الثيمات الموسمية');
    setText('.reduced-motion-section > h3',q('Reduced Motion','تقليل الحركة')); const modeLabel=document.querySelector('.reduced-motion-section .settings-choice-group > span'); if(modeLabel)modeLabel.textContent=q('Mode','الوضع');
    if(refs.motionSystemNote)refs.motionSystemNote.textContent=q("Following system's reduce motion preference. Toggle any motion setting to switch to manual mode.",'يتبع تفضيل النظام لتقليل الحركة. غيّر أي إعداد للحركة للانتقال إلى الوضع اليدوي.');
    const motionLines=document.querySelectorAll('.reduced-motion-section .settings-line > span'); if(motionLines[0])motionLines[0].textContent=q('Static background','خلفية ثابتة'); if(motionLines[1])motionLines[1].textContent=q('Disable gameplay animations','تعطيل حركات اللعب');
    if(refs.quickGuideRulesBtn)refs.quickGuideRulesBtn.textContent=q('RULES','القواعد');
    if(refs.rulesDialogV14){
      const title=refs.rulesDialogV14.querySelector('h2');
      if(title)title.textContent=q('CODENAMES — CLASSIC RULES','CODENAMES — قواعد الكلاسيك');
      const sections=refs.rulesDialogV14.querySelectorAll('.rules-v14-content section');
      const rr=ar?[
        ['الهدف','اعثر على جميع عملاء فريقك قبل الفريق الآخر. تجنب القاتل: كشفه ينهي اللعبة فوراً بخسارة الفريق الذي اختاره.'],
        ['الفرق والأدوار','فريقان يتنافسان. لكل فريق قائد تجسس واحد ولاعب أو أكثر. قادة التجسس يعرفون الهوية السرية لجميع البطاقات الـ25.'],
        ['اللوحة والفريق البادئ','تحتوي اللوحة على 25 كلمة. الفريق البادئ لديه 9 عملاء، والآخر 8، مع 7 بطاقات محايدة وقاتل واحد.'],
        ['التلميحات','يعطي قائد التجسس النشط كلمة واحدة ورقماً واحداً. الكلمة تربط البطاقات المقصودة، والرقم يحدد عددها.'],
        ['التخمين','للتلميح ذي الرقم n يستطيع الفريق إجراء حتى n + 1 تخمينات ما دامت الإجابات صحيحة. يجب إجراء تخمين واحد على الأقل ويمكن التوقف بعده.'],
        ['البطاقات الخاطئة','البطاقة المحايدة تنهي الدور. بطاقة الخصم تُكشف لصالحه وتنهي الدور، وإذا كانت آخر عميل له يفوز الخصم فوراً.'],
        ['الفوز والقاتل','يفوز الفريق فور كشف جميع عملائه. كشف القاتل ينهي اللعبة فوراً ويخسر الفريق الذي اختاره.'],
        ['قانونية التلميح','يجب أن يرتبط التلميح بالمعنى، لا بموقع البطاقات أو حيل التهجئة، ولا يجوز أن يكون كلمة ظاهرة على اللوحة أو صيغة محظورة منها. الخلافات الدلالية يحسمها اللاعبون.'],
        ['تلميحات الخبراء','عند تفعيل قواعد الخبراء يسمح Unlimited بعدد غير محدود من التخمينات الصحيحة، كما أن تلميح الرقم 0 يلغي حد n + 1 الطبيعي.']
      ]:[
        ['Objective','Find all of your team\'s agents before the other team. Avoid the Assassin: revealing it loses the game immediately.'],
        ['Teams & roles','Two teams compete. Each team has one Spymaster and one or more Operatives. The Spymasters know the secret identities of all 25 cards.'],
        ['Board & starting team','The board contains 25 words. The starting team has 9 agents, the other team has 8, with 7 Neutral cards and 1 Assassin.'],
        ['Clues','The active Spymaster gives one word and one number. The word connects to one or more intended cards; the number says how many cards are intended.'],
        ['Guessing','For a numbered clue n, the team may make up to n + 1 guesses while its guesses remain correct. The team must make at least one guess and may stop early after that.'],
        ['Wrong cards','A Neutral card ends the turn. An opponent card is revealed for the opponent and ends the turn. If that was the opponent\'s last agent, the opponent wins immediately.'],
        ['Winning & Assassin','A team wins immediately when all of its agents are revealed. Revealing the Assassin ends the game immediately and the guessing team loses.'],
        ['Clue legality','Clues must relate to meaning, not board position or spelling tricks, and cannot be a visible board word or a prohibited form of one. Semantic disputes are resolved by the players.'],
        ['Expert clues','When Expert Rules are enabled, Unlimited allows unlimited correct guesses, while a clue numbered 0 also removes the normal n + 1 cap.']
      ];
      sections.forEach((section,i)=>{if(rr[i]){const h=section.querySelector('h3'),p=section.querySelector('p');if(h)h.textContent=rr[i][0];if(p)p.textContent=rr[i][1];}});
    }
    if(refs.newsDialogV14){const h=refs.newsDialogV14.querySelector('h2'),p=refs.newsDialogV14.querySelector('p'); if(h)h.textContent=q('News','الأخبار'); if(p)p.textContent=q('V16 fixes invite-link entry, adds the Welcome to Codenames nickname gate, allows players to join and choose teams during an active match, and keeps the V13 visual system and game engine intact.','يصلح V16 الدخول من رابط الدعوة، ويضيف بوابة Welcome to Codenames لاختيار الاسم، ويسمح للاعبين بالدخول واختيار الفريق حتى أثناء المباراة مع الحفاظ على ألوان ومحرك V13.');}
  }

  function renderLobby() {
    const inRoom = Boolean(context.inRoom);
    const inLobby = inRoom && context.roomStatus === 'lobby';
    document.body.classList.toggle('online-room-active', inRoom);
    document.body.classList.toggle('online-lobby-active', inLobby);
    if (refs.roomTopNav) refs.roomTopNav.hidden = !inRoom;
    if (!inRoom) return;
    translateLobbyShell();
    const all = players().filter(Boolean);
    if (refs.roomNavPlayerCount) refs.roomNavPlayerCount.textContent = String(all.length);
    renderSettings();
    if (!inLobby) return;

    const specs = all.filter(isSpectator);
    const blueOps = all.filter((p) => p.team === 'blue' && p.role === 'operative');
    const blueSpy = all.filter((p) => p.team === 'blue' && p.role === 'spymaster');
    const redOps = all.filter((p) => p.team === 'red' && p.role === 'operative');
    const redSpy = all.filter((p) => p.team === 'red' && p.role === 'spymaster');
    fillList(refs.spectatorLobbyList, specs);
    fillList(refs.blueOperativesList, blueOps); fillList(refs.blueSpymasterList, blueSpy);
    fillList(refs.redOperativesList, redOps); fillList(refs.redSpymasterList, redSpy);

    const current = context.player || {};
    const locked = Boolean(context.roomSettings && context.roomSettings.teamsLocked);
    document.querySelectorAll('[data-join-team][data-join-role]').forEach((btn) => {
      const team=btn.dataset.joinTeam, role=btn.dataset.joinRole;
      const same = current.team === team && current.role === role;
      const occupied = role === 'spymaster' && all.some((p)=>p.uid!==context.uid && p.team===team && p.role==='spymaster');
      btn.classList.toggle('is-current', same);
      btn.disabled = (!context.isHost && locked) || occupied;
      btn.textContent = same ? t('leaveTeam') : occupied ? t('taken') : (!context.isHost && locked) ? t('locked') : t('join');
    });

    const validation = validateLobby();
    if (refs.onlineStartGameBtn) {
      refs.onlineStartGameBtn.disabled = !context.isHost || !validation.valid;
      refs.onlineStartGameBtn.textContent = context.isHost ? t('start') : t('waiting');
    }
    if (refs.resetTeamsBtn) refs.resetTeamsBtn.disabled = !context.isHost;
    if (refs.onlineRandomTeamsBtn) refs.onlineRandomTeamsBtn.disabled = !context.isHost || all.length < 4;
    if (refs.lobbyValidationMessage) {
      refs.lobbyValidationMessage.hidden = validation.valid || !context.isHost;
      refs.lobbyValidationMessage.textContent = validation.errors.join(' ');
    }
    const cardLang = (context.roomSettings && context.roomSettings.cardLanguage) || 'both';
    if (refs.wordLanguageSummary) refs.wordLanguageSummary.textContent = cardLang === 'ar' ? 'العربية' : cardLang === 'en' ? 'English' : (lang()==='ar' ? 'العربية + English' : 'Arabic + English');

    updateQuickGuideText();
    renderSettings();
    maybeAutoGuide();
  }

  function onlineApi() { return global.Codenames && global.Codenames.Online ? global.Codenames.Online : null; }
  async function assign(team, role) {
    const api=onlineApi(); if(!api || !api.setSelfAssignment) return;
    const result=await api.setSelfAssignment(team,role);
    if (result && !result.ok && refs.lobbyValidationMessage) { refs.lobbyValidationMessage.hidden=false; refs.lobbyValidationMessage.textContent=result.message || result.code || 'Could not change role.'; }
  }

  function showDialog(dialog) {
    if (!dialog) return;
    try {
      if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
      else dialog.setAttribute('open', '');
    } catch (_) { dialog.setAttribute('open', ''); }
  }
  function hideDialog(dialog) {
    if (!dialog) return;
    try { if (typeof dialog.close === 'function' && dialog.open) dialog.close(); else dialog.removeAttribute('open'); }
    catch (_) { dialog.removeAttribute('open'); }
  }

  function openSettings(tab) {
    activeSettingsTab = tab || activeSettingsTab || 'player';
    document.querySelectorAll('[data-settings-tab]').forEach((b)=>b.classList.toggle('active',b.dataset.settingsTab===activeSettingsTab));
    document.querySelectorAll('[data-settings-panel]').forEach((p)=>p.classList.toggle('active',p.dataset.settingsPanel===activeSettingsTab));
    renderSettings();
    showDialog(refs.roomSettingsDialog);
  }
  function closeSettings(){ hideDialog(refs.roomSettingsDialog); }
  function openRules(){ showDialog(refs.rulesDialogV14); }

  function renderSettings() {
    if (!refs.settingsPlayersList) return;
    fillList(refs.settingsPlayersList, players());
    const room=context.roomSettings||{};
    const lobbyEditable = context.roomStatus === 'lobby';
    const roleEditable = context.roomStatus === 'lobby' || context.roomStatus === 'playing';
    refs.settingsLockTeams.checked=Boolean(room.teamsLocked); refs.settingsLockTeams.disabled=!context.isHost || !lobbyEditable;
    refs.settingsCardLanguage.value=room.cardLanguage||'both'; refs.settingsCardLanguage.disabled=!context.isHost || !lobbyEditable;
    refs.settingsStrictClues.checked=room.strictClues!==false; refs.settingsStrictClues.disabled=!context.isHost || !lobbyEditable;
    refs.settingsExpertRules.checked=Boolean(room.expertRules); refs.settingsExpertRules.disabled=!context.isHost || !lobbyEditable;
    refs.settingsResetTeamsBtn.disabled=!context.isHost || !lobbyEditable; refs.settingsRandomTeamsBtn.disabled=!context.isHost || !lobbyEditable;
    const p=context.player||{}; refs.settingsNickname.value=p.name||'';
    const aid=avatarIdFor(p); refs.settingsAvatarSelect.value=String(aid);
    refs.settingsAvatarPreview.replaceChildren(); const img=document.createElement('img'); img.src=avatarSrc(p); img.alt=''; refs.settingsAvatarPreview.appendChild(img);
    document.querySelectorAll('[data-assign-team][data-assign-role]').forEach((b)=>{
      const same=p.team===b.dataset.assignTeam && p.role===b.dataset.assignRole;
      b.classList.toggle('active',same);
      const spyTaken=b.dataset.assignRole==='spymaster' && players().some((other)=>other.uid!==context.uid && other.team===b.dataset.assignTeam && other.role==='spymaster');
      b.disabled=!roleEditable || (context.roomStatus === 'lobby' && !context.isHost && Boolean(room.teamsLocked)) || spyTaken;
    });
    refs.prefUiLanguage.value=lang();
    refs.prefMusicVolume.value=safeGet('cn-v15-music-volume','0');
    refs.prefEffectsVolume.value=String(Math.round(Number(safeGet('cn-sound-volume','0.55'))*100));
    refs.prefAlwaysGuess.checked=boolPref('cn-v15-always-guess',false); refs.prefHideRoomUrl.checked=boolPref('cn-v15-hide-room-url',false);
    refs.a11yColorblind.checked=boolPref('cn-v15-colorblind',false); refs.a11ySeasonal.checked=boolPref('cn-v15-disable-seasonal',false);
    refs.a11yStaticBackground.checked=boolPref('cn-v15-static-bg',false); refs.a11yDisableAnimations.checked=boolPref('cn-v15-disable-animations',false);
    const theme=safeGet('cn-v15-theme','light'); document.querySelectorAll('[data-theme-choice]').forEach((b)=>b.classList.toggle('active',b.dataset.themeChoice===theme));
    const size=safeGet('cn-v15-text-size','small'); document.querySelectorAll('[data-text-size]').forEach((b)=>b.classList.toggle('active',b.dataset.textSize===size));
    const motion=safeGet('cn-v15-motion-mode','system'); document.querySelectorAll('[data-motion-mode]').forEach((b)=>b.classList.toggle('active',b.dataset.motionMode===motion));
    if(refs.motionSystemNote) refs.motionSystemNote.hidden=motion!=='system';
  }

  function updateQuickGuideText(){ if(refs.quickGuideTitle)refs.quickGuideTitle.textContent=t('setupTitle'); if(refs.quickGuideText)refs.quickGuideText.textContent=context.isHost?t('hostGuide'):t('playerGuide'); if(refs.quickGuideGotItBtn)refs.quickGuideGotItBtn.textContent=t('gotIt'); const lab=document.querySelector('.quick-auto-toggle'); if(lab && lab.firstChild) lab.firstChild.textContent=`${t('auto')} `; }
  function guideSeen(){return boolPref('cn-v15-guide-setup-seen',false);}
  function openGuide(){updateQuickGuideText(); if(refs.quickGuidePopover)refs.quickGuidePopover.hidden=false;}
  function closeGuide(){if(refs.quickGuidePopover)refs.quickGuidePopover.hidden=true;}
  function maybeAutoGuide(){ if(!context.inRoom||context.roomStatus!=='lobby'||!refs.quickGuidePopover)return; const auto=boolPref('cn-v15-guide-auto',false); refs.quickGuideAutoShow.checked=auto; if(auto&&!guideSeen()&&refs.quickGuidePopover.hidden)openGuide(); }

  function applyPreferences() {
    const theme=safeGet('cn-v15-theme','light');
    let resolved=theme;
    if(theme==='system') resolved=global.matchMedia&&global.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    document.documentElement.dataset.theme=resolved;
    document.documentElement.dataset.textSize=safeGet('cn-v15-text-size','small');
    document.body.classList.toggle('always-show-guess',boolPref('cn-v15-always-guess',false));
    document.body.classList.toggle('colorblind-symbols',boolPref('cn-v15-colorblind',false));
    document.body.classList.toggle('static-background',boolPref('cn-v15-static-bg',false));
    const mode=safeGet('cn-v15-motion-mode','system');
    const systemReduce=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const disable=mode==='system'?systemReduce:boolPref('cn-v15-disable-animations',false);
    document.body.classList.toggle('disable-gameplay-animations',Boolean(disable));
  }

  function bind() {
    document.querySelectorAll('[data-join-team][data-join-role]').forEach((btn)=>btn.addEventListener('click',()=>{
      const p=context.player||{}; const same=p.team===btn.dataset.joinTeam&&p.role===btn.dataset.joinRole;
      assign(same?'spectator':btn.dataset.joinTeam,same?'spectator':btn.dataset.joinRole);
    }));
    refs.resetTeamsBtn&&refs.resetTeamsBtn.addEventListener('click',()=>{const a=onlineApi(); if(a&&a.resetTeams)a.resetTeams();});
    refs.roomAdminBtn&&refs.roomAdminBtn.addEventListener('click',()=>openSettings('admin'));
    refs.roomSettingsBtn&&refs.roomSettingsBtn.addEventListener('click',()=>openSettings('player'));
    refs.wordLanguageRow&&refs.wordLanguageRow.addEventListener('click',()=>openSettings('admin'));
    refs.roomNewsBtn&&refs.roomNewsBtn.addEventListener('click',()=>showDialog(refs.newsDialogV14));
    refs.roomRulesBtn&&refs.roomRulesBtn.addEventListener('click',openRules);
    refs.quickGuideBtn&&refs.quickGuideBtn.addEventListener('click',openGuide); refs.quickGuideCloseBtn&&refs.quickGuideCloseBtn.addEventListener('click',closeGuide);
    refs.quickGuideGotItBtn&&refs.quickGuideGotItBtn.addEventListener('click',()=>{safeSet('cn-v15-guide-setup-seen','1');closeGuide();});
    refs.quickGuideRulesBtn&&refs.quickGuideRulesBtn.addEventListener('click',()=>{closeGuide();openRules();});
    refs.quickGuideAutoShow&&refs.quickGuideAutoShow.addEventListener('change',()=>safeSet('cn-v15-guide-auto',refs.quickGuideAutoShow.checked?'1':'0'));
    refs.roomSettingsCloseBtn&&refs.roomSettingsCloseBtn.addEventListener('click',closeSettings);
    refs.rulesCloseBtnV14&&refs.rulesCloseBtnV14.addEventListener('click',()=>hideDialog(refs.rulesDialogV14)); refs.newsCloseBtnV14&&refs.newsCloseBtnV14.addEventListener('click',()=>hideDialog(refs.newsDialogV14));
    document.querySelectorAll('[data-settings-tab]').forEach((b)=>b.addEventListener('click',()=>openSettings(b.dataset.settingsTab)));
    refs.settingsLockTeams&&refs.settingsLockTeams.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.setTeamsLocked)a.setTeamsLocked(refs.settingsLockTeams.checked);});
    refs.settingsResetTeamsBtn&&refs.settingsResetTeamsBtn.addEventListener('click',()=>{const a=onlineApi(); if(a&&a.resetTeams)a.resetTeams();});
    refs.settingsRandomTeamsBtn&&refs.settingsRandomTeamsBtn.addEventListener('click',()=>{const a=onlineApi(); if(a&&a.randomizeTeams)a.randomizeTeams();});
    refs.settingsCardLanguage&&refs.settingsCardLanguage.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.updateRoomSettings)a.updateRoomSettings({cardLanguage:refs.settingsCardLanguage.value});});
    refs.settingsStrictClues&&refs.settingsStrictClues.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.updateRoomSettings)a.updateRoomSettings({strictClues:refs.settingsStrictClues.checked});});
    refs.settingsExpertRules&&refs.settingsExpertRules.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.updateRoomSettings)a.updateRoomSettings({expertRules:refs.settingsExpertRules.checked});});
    refs.settingsCopyInviteBtn&&refs.settingsCopyInviteBtn.addEventListener('click',async()=>{const a=onlineApi(); if(a&&a.copyInvite){await a.copyInvite(); refs.settingsCopyInviteBtn.textContent=lang()==='ar'?'تم النسخ ✓':'Copied ✓'; setTimeout(()=>refs.settingsCopyInviteBtn.textContent=lang()==='ar'?'نسخ رابط الدعوة':'Copy Invite Link',1200);}});
    refs.settingsNickname&&refs.settingsNickname.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.setNickname)a.setNickname(refs.settingsNickname.value);});
    refs.settingsAvatarSelect&&refs.settingsAvatarSelect.addEventListener('change',()=>{const a=onlineApi(); if(a&&a.setAvatar)a.setAvatar(Number(refs.settingsAvatarSelect.value));});
    document.querySelectorAll('[data-assign-team][data-assign-role]').forEach((b)=>b.addEventListener('click',()=>assign(b.dataset.assignTeam,b.dataset.assignRole)));
    refs.settingsLeaveMatchBtn&&refs.settingsLeaveMatchBtn.addEventListener('click',()=>{const a=onlineApi(); if(a&&a.leaveRoom){closeSettings();a.leaveRoom();}});
    refs.prefUiLanguage&&refs.prefUiLanguage.addEventListener('change',()=>{const select=document.getElementById('uiLanguageGlobal'); if(select){select.value=refs.prefUiLanguage.value; select.dispatchEvent(new Event('change',{bubbles:true})); setTimeout(renderLobby,0);}});
    document.querySelectorAll('[data-theme-choice]').forEach((b)=>b.addEventListener('click',()=>{safeSet('cn-v15-theme',b.dataset.themeChoice);applyPreferences();renderSettings();}));
    refs.prefMusicVolume&&refs.prefMusicVolume.addEventListener('input',()=>safeSet('cn-v15-music-volume',refs.prefMusicVolume.value));
    refs.prefEffectsVolume&&refs.prefEffectsVolume.addEventListener('input',()=>{const v=Math.max(0,Math.min(100,Number(refs.prefEffectsVolume.value)||0))/100; safeSet('cn-sound-volume',String(v)); const slider=document.getElementById('soundVolume'); if(slider){slider.value=String(v);slider.dispatchEvent(new Event('input',{bubbles:true}));}});
    refs.prefAlwaysGuess&&refs.prefAlwaysGuess.addEventListener('change',()=>{safeSet('cn-v15-always-guess',refs.prefAlwaysGuess.checked?'1':'0');applyPreferences();});
    refs.prefHideRoomUrl&&refs.prefHideRoomUrl.addEventListener('change',()=>{safeSet('cn-v15-hide-room-url',refs.prefHideRoomUrl.checked?'1':'0'); const a=onlineApi(); if(a&&a.applyRoomUrlPreference)a.applyRoomUrlPreference();});
    refs.prefShowHintsBtn&&refs.prefShowHintsBtn.addEventListener('click',()=>{safeSet('cn-v15-guide-setup-seen','0');closeSettings();openGuide();});
    document.querySelectorAll('[data-text-size]').forEach((b)=>b.addEventListener('click',()=>{safeSet('cn-v15-text-size',b.dataset.textSize);applyPreferences();renderSettings();}));
    refs.a11yColorblind&&refs.a11yColorblind.addEventListener('change',()=>{safeSet('cn-v15-colorblind',refs.a11yColorblind.checked?'1':'0');applyPreferences();});
    refs.a11ySeasonal&&refs.a11ySeasonal.addEventListener('change',()=>safeSet('cn-v15-disable-seasonal',refs.a11ySeasonal.checked?'1':'0'));
    document.querySelectorAll('[data-motion-mode]').forEach((b)=>b.addEventListener('click',()=>{safeSet('cn-v15-motion-mode',b.dataset.motionMode);applyPreferences();renderSettings();}));
    [refs.a11yStaticBackground,refs.a11yDisableAnimations].filter(Boolean).forEach((el)=>el.addEventListener('change',()=>{safeSet('cn-v15-motion-mode','manual');safeSet('cn-v15-static-bg',refs.a11yStaticBackground.checked?'1':'0');safeSet('cn-v15-disable-animations',refs.a11yDisableAnimations.checked?'1':'0');applyPreferences();renderSettings();}));
    if(global.matchMedia){global.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyPreferences);global.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',applyPreferences);}
  }

  function init() {
    if(initialized)return; initialized=true; cache();
    if(refs.settingsAvatarSelect){for(let i=1;i<=25;i+=1){const o=document.createElement('option');o.value=String(i);o.textContent=`Avatar ${i}`;refs.settingsAvatarSelect.appendChild(o);}}
    if(refs.quickGuidePopover)refs.quickGuidePopover.hidden=true;
    refs.quickGuideAutoShow.checked=boolPref('cn-v15-guide-auto',false);
    bind(); applyPreferences(); renderLobby();
  }

  global.addEventListener('codenames-online-state',(event)=>{context=Object.assign({},context,event.detail||{}); if(!initialized)init(); renderLobby();});
  global.addEventListener('codenames-online-ready',()=>{if(!initialized)init(); const api=onlineApi(); if(api&&api.getContext){context=Object.assign({},context,api.getContext());renderLobby();}});
  global.addEventListener('codenames-invite-joined-playing',()=>{if(!initialized)init(); setTimeout(()=>openSettings('player'),0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})(window);
