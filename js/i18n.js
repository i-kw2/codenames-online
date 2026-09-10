(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};

  const STRINGS = {
    ar: {
      appTitle: 'Codenames — عربي / English', subtitle: 'نسخة محلية للطور الكلاسيكي',
      setup: 'إعداد اللعبة', addPlayer: 'إضافة لاعب', randomTeams: 'توزيع الفرق عشوائياً', randomSpymasters: 'اختيار القادة عشوائياً',
      startGame: 'ابدأ اللعبة', playerName: 'اسم اللاعب', team: 'الفريق', role: 'الدور', red: 'الأحمر', blue: 'الأزرق',
      spymaster: 'قائد التجسس', operative: 'لاعب ميداني', spectator: 'مشاهد', spectators: 'المشاهدون', redTeam: 'الفريق الأحمر', blueTeam: 'الفريق الأزرق', remove: 'حذف', settings: 'الإعدادات', uiLanguage: 'لغة الواجهة',
      cardLanguage: 'لغة البطاقات', both: 'العربية + الإنجليزية', arabic: 'العربية', english: 'English', strictClues: 'تلميحات صارمة',
      expertRules: 'قواعد الخبراء (0 / Unlimited)', wordList: 'قائمة الكلمات', defaultWords: 'القائمة الافتراضية', customWords: 'قائمة مخصصة',
      manageWords: 'إدارة الكلمات', currentTeam: 'الدور الحالي', startingTeam: 'الفريق البادئ', remaining: 'المتبقي',
      currentClue: 'التلميح الحالي', noClue: 'لا يوجد', guesses: 'التخمينات', phaseClue: 'بانتظار التلميح', phaseGuessing: 'مرحلة التخمين',
      phaseEnded: 'انتهت اللعبة', phasePenalty: 'عقوبة تلميح غير قانوني', endTurn: 'إنهاء الدور', spymasterKey: 'مفتاح القائد',
      gameLog: 'سجل اللعبة', errorLog: 'سجل الأخطاء', resetGame: 'إعادة الجولة', newGame: 'لعبة جديدة', submitClue: 'اعتماد التلميح',
      clueWord: 'كلمة التلميح', clueNumber: 'الرقم', normal: 'رقم عادي', unlimited: 'Unlimited', zero: '0 — تجنب', challengeClue: 'الاعتراض على التلميح',
      allowClue: 'السماح بالتلميح', rejectClue: 'رفض التلميح', passToSpymasters: 'مرّر الجهاز إلى قادة التجسس',
      holdReveal: 'اضغط مطولاً لإظهار المفتاح', releaseHide: 'العودة للاعبين', cancel: 'إلغاء', close: 'إغلاق', copyLogs: 'نسخ السجل',
      downloadLogs: 'تنزيل JSON', clearLogs: 'مسح السجل', importWords: 'استيراد الكلمات', useCustom: 'استخدام القائمة المخصصة', revertDefault: 'العودة للافتراضية',
      wordFormat: 'الصيغة', pasteWords: 'الصق الكلمات هنا', chooseFile: 'اختر ملف TXT / CSV / JSON', import: 'استيراد', accepted: 'مقبول', rejected: 'مرفوض',
      wordHelp: 'TXT: عربي|English — CSV: ar,en — JSON: [{"ar":"قمر","en":"Moon"}]', setupError: 'راجع إعداد اللاعبين قبل البدء.',
      winner: 'الفائز', assassin: 'القاتل', neutral: 'محايد', agent: 'عميل', revealed: 'مكشوف', hidden: 'مخفي',
      mustGuessFirst: 'يجب إجراء تخمين واحد على الأقل قبل إنهاء الدور.', clueRequired: 'أدخل تلميحاً صالحاً.', clueMatchesBoard: 'التلميح يطابق كلمة ظاهرة على اللوحة.',
      clueOneWord: 'في الوضع الصارم يجب أن يكون التلميح كلمة واحدة.', invalidNumber: 'اختر رقماً موجباً.', wrongPhase: 'هذا الإجراء غير متاح الآن.',
      customNeed25: 'تحتاج 25 زوج كلمات صالحاً وفريداً على الأقل.', customLoaded: 'تم تحميل القائمة المخصصة.', resetConfirm: 'إعادة الجولة بكلمات وتوزيع جديدين؟',
      newGameConfirm: 'العودة إلى شاشة الإعداد وبدء لعبة جديدة؟', cardLangLocked: 'لغة البطاقات مقفلة أثناء الجولة حتى لا تظهر معلومات جديدة.',
      penaltyTitle: 'عقوبة التلميح', penaltyText: 'يمكن لقائد الفريق المنافس كشف عميل واحد من فريقه، أو تخطي العقوبة.', skipPenalty: 'تخطي العقوبة',
      choosePenaltyCard: 'اختر عميلاً غير مكشوف من فريقك', guessedOwn: 'تخمين صحيح. يمكنكم الاستمرار.', turnEnded: 'انتهى الدور.',
      assassinHit: 'تم اختيار القاتل — انتهت اللعبة.', allAgentsFound: 'تم العثور على جميع العملاء.', operativeView: 'وضع اللاعبين', spymasterView: 'وضع القائد',
      readyToGuess: 'التلميح معتمد. أعطِ الجهاز للاعبين وابدأوا التخمين.', challengePending: 'يوجد اعتراض على التلميح.', noErrors: 'لا توجد أخطاء مسجلة.', noEvents: 'لا توجد أحداث بعد.',
      copied: 'تم النسخ.', copyFailed: 'تعذر النسخ تلقائياً.', customSummary: 'نتيجة الاستيراد', formatAuto: 'تلقائي',
      clueZeroHint: 'المعنى: تجنبوا الكلمات المرتبطة بالتلميح، والتخمينات غير محدودة.', clueUnlimitedHint: 'التخمينات غير محدودة ما دامت صحيحة.',
      rolesVisibleWarning: 'المفتاح السري ظاهر الآن. أخفه قبل إعادة الجهاز للاعبين.', candidateCards: 'البطاقات المحتملة', candidateHelp: 'حدد أكثر من بطاقة ثم ثبّت بطاقة واحدة كتخمين نهائي.', spymasterCandidateHelp: 'ستظهر هنا البطاقات التي يفكر فيها فريقك.', teamConsidering: 'يفكر بها الفريق', clearCandidates: 'مسح التحديد', confirmGuess: 'اعتماد التخمين', picked: 'تم اختيارها', soundOn: 'الصوت يعمل', soundOff: 'الصوت مكتوم'
    },
    en: {
      appTitle: 'Codenames — Arabic / English', subtitle: 'Local classic-mode implementation',
      setup: 'Game Setup', addPlayer: 'Add Player', randomTeams: 'Randomise Teams', randomSpymasters: 'Randomise Spymasters',
      startGame: 'Start Game', playerName: 'Player name', team: 'Team', role: 'Role', red: 'Red', blue: 'Blue',
      spymaster: 'Spymaster', operative: 'Operative', spectator: 'Spectator', spectators: 'Spectators', redTeam: 'Red Team', blueTeam: 'Blue Team', remove: 'Remove', settings: 'Settings', uiLanguage: 'UI language',
      cardLanguage: 'Card language', both: 'Arabic + English', arabic: 'Arabic', english: 'English', strictClues: 'Strict clue mode',
      expertRules: 'Expert rules (0 / Unlimited)', wordList: 'Word list', defaultWords: 'Built-in words', customWords: 'Custom words',
      manageWords: 'Manage words', currentTeam: 'Current team', startingTeam: 'Starting team', remaining: 'Remaining',
      currentClue: 'Current clue', noClue: 'None', guesses: 'Guesses', phaseClue: 'Waiting for clue', phaseGuessing: 'Guessing',
      phaseEnded: 'Game over', phasePenalty: 'Invalid clue penalty', endTurn: 'End Turn', spymasterKey: 'Spymaster Key',
      gameLog: 'Game Log', errorLog: 'Error Log', resetGame: 'Reset Round', newGame: 'New Game', submitClue: 'Submit Clue',
      clueWord: 'Clue word', clueNumber: 'Number', normal: 'Normal number', unlimited: 'Unlimited', zero: '0 — Avoid', challengeClue: 'Challenge Clue',
      allowClue: 'Allow Clue', rejectClue: 'Reject Clue', passToSpymasters: 'Pass the device to the spymasters',
      holdReveal: 'Hold to reveal the key', releaseHide: 'Return to Operatives', cancel: 'Cancel', close: 'Close', copyLogs: 'Copy Logs',
      downloadLogs: 'Download JSON', clearLogs: 'Clear Logs', importWords: 'Import Words', useCustom: 'Use Custom List', revertDefault: 'Use Built-in List',
      wordFormat: 'Format', pasteWords: 'Paste words here', chooseFile: 'Choose TXT / CSV / JSON file', import: 'Import', accepted: 'Accepted', rejected: 'Rejected',
      wordHelp: 'TXT: Arabic|English — CSV: ar,en — JSON: [{"ar":"قمر","en":"Moon"}]', setupError: 'Review player setup before starting.',
      winner: 'Winner', assassin: 'Assassin', neutral: 'Neutral', agent: 'Agent', revealed: 'Revealed', hidden: 'Hidden',
      mustGuessFirst: 'You must make at least one guess before ending the turn.', clueRequired: 'Enter a valid clue.', clueMatchesBoard: 'The clue matches a visible board word.',
      clueOneWord: 'Strict mode requires a one-word clue.', invalidNumber: 'Choose a positive number.', wrongPhase: 'That action is not available now.',
      customNeed25: 'At least 25 valid unique bilingual word pairs are required.', customLoaded: 'Custom word list loaded.', resetConfirm: 'Reset this round with new words and roles?',
      newGameConfirm: 'Return to setup and start a new game?', cardLangLocked: 'Card language is locked during a round to avoid revealing new semantic information.',
      penaltyTitle: 'Invalid Clue Penalty', penaltyText: 'The opposing spymaster may reveal one unrevealed agent from their own team, or skip the penalty.', skipPenalty: 'Skip Penalty',
      choosePenaltyCard: 'Choose one unrevealed agent from your team', guessedOwn: 'Correct guess. You may continue.', turnEnded: 'Turn ended.',
      assassinHit: 'Assassin selected — game over.', allAgentsFound: 'All agents have been found.', operativeView: 'Operative View', spymasterView: 'Spymaster View',
      readyToGuess: 'Clue accepted. Return the device to the operatives and start guessing.', challengePending: 'A clue challenge is pending.', noErrors: 'No errors logged.', noEvents: 'No events yet.',
      copied: 'Copied.', copyFailed: 'Automatic copy failed.', customSummary: 'Import result', formatAuto: 'Auto',
      clueZeroHint: 'Meaning: avoid words related to this clue; guesses are unlimited.', clueUnlimitedHint: 'Guesses are unlimited while guesses remain correct.',
      rolesVisibleWarning: 'The secret key is visible. Hide it before returning the device to operatives.', candidateCards: 'Cards under consideration', candidateHelp: 'Mark several cards, then confirm one as the final guess.', spymasterCandidateHelp: 'Cards your team is considering will appear here.', teamConsidering: 'Team considering', clearCandidates: 'Clear selection', confirmGuess: 'Confirm guess', picked: 'Picked', soundOn: 'Sound on', soundOff: 'Sound muted'
    }
  };

  let language = 'ar';

  function t(key, vars) {
    const dict = STRINGS[language] || STRINGS.ar;
    let value = dict[key] || STRINGS.en[key] || key;
    if (vars) Object.keys(vars).forEach((name) => { value = value.replaceAll(`{${name}}`, String(vars[name])); });
    return value;
  }

  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'ar';
    if (global.document) {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
    return language;
  }

  function getLanguage() { return language; }
  function getStrings() { return STRINGS; }

  CN.I18n = { t, setLanguage, getLanguage, getStrings };
})(window);
