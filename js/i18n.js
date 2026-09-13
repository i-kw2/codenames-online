const STRINGS = {
  en: {
    title: 'Survey Showdown', tagline: 'Think fast. Guess the crowd.', play: 'Play', howToPlay: 'How to Play', questionBank: 'Question Bank', settings: 'Settings', profile: 'Statistics',
    back: 'Back', home: 'Main Menu', save: 'Save', cancel: 'Cancel', close: 'Close', continue: 'Continue', start: 'Start', rematch: 'Rematch', nextRound: 'Next Round',
    classic: 'Classic', classicDesc: 'Three rounds. Score as many survey answers as possible.', traditional: 'Traditional', traditionalDesc: 'Face-Off, three strikes, then a steal chance.', fastMoney: 'Fast Money', fastMoneyDesc: 'Five rapid questions for each player.', vsAI: 'VS AI', vsAIDesc: 'Challenge a computer opponent.', local2: 'Local 2 Player', local2Desc: 'Take turns on one device.', online: 'Online Classic', onlineDesc: 'Create or join a private room.',
    matchSetup: 'Match Setup', player1: 'Player 1', player2: 'Player 2', teamA: 'Team A', teamB: 'Team B', name: 'Name', roundTime: 'Round Time', seconds: 'seconds', difficulty: 'AI Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard', startMatch: 'Start Match',
    round: 'Round', score: 'Score', time: 'Time', turn: "{name}'s turn", question: 'Question', typeAnswer: 'Type your answer…', submit: 'Submit', pause: 'Pause', resume: 'Resume', quit: 'Quit',
    correct: 'Correct!', wrong: 'Wrong answer', duplicate: 'Already found!', empty: 'Enter an answer first.', topAnswer: 'Top answer!', timeUp: "Time's up!", roundComplete: 'Round Complete', winner: 'Winner', tie: 'Tie!', suddenDeath: 'Sudden Death', goodGame: 'Good game!',
    faceOff: 'Face-Off', faceOffPrompt: '{team}, enter your face-off answer.', playChoice: 'Play', passChoice: 'Pass', choosePlayPass: 'Choose Play or Pass', strikes: 'Strikes', steal: 'Steal!', stealPrompt: 'One answer. One chance.', stealSuccess: 'Steal successful!', stealFailed: 'Steal failed!', roundPot: 'Round Pot',
    fmIntro: 'Five questions. One answer per player for each question.', fmQuestion: 'Question {current} of {total}', fmPlayerComplete: 'Player 1 complete', passDevice: 'Pass the device to Player 2, then press Ready.', ready: 'Ready', tryAnother: 'Same answer — try another.', results: 'Results', total: 'Total', bonus200: '200+ points!',
    language: 'Language', english: 'English', arabic: 'Arabic', sound: 'Sound effects', music: 'Music', virtualKeyboard: 'Virtual Keyboard', reducedMotion: 'Reduced Motion', on: 'On', off: 'Off', resetStats: 'Reset Statistics',
    gamesPlayed: 'Games Played', wins: 'Wins', losses: 'Losses', highestScore: 'Highest Score', averageScore: 'Average Score', correctGuesses: 'Correct Guesses', wrongGuesses: 'Wrong Guesses',
    qbSearch: 'Search questions…', allCategories: 'All Categories', addQuestion: 'Add Question', importJSON: 'Import JSON', exportJSON: 'Export JSON', builtIn: 'Built-in', custom: 'Custom', edit: 'Edit', delete: 'Delete', duplicateQuestion: 'Duplicate', answers: 'answers', valid: 'Valid',
    editorTitle: 'Question Editor', questionId: 'Question ID', category: 'Category', englishQuestion: 'English Question', arabicQuestion: 'Arabic Question', englishAnswer: 'English Answer', arabicAnswer: 'Arabic Answer', points: 'Points', aliasesEn: 'English aliases (comma separated)', aliasesAr: 'Arabic aliases (comma separated)', addAnswer: 'Add Answer', deleteAnswer: 'Delete Answer',
    importTitle: 'Import Question Bank JSON', importHelp: 'Paste an array of question objects. Data is validated before it is saved.', import: 'Import', exportDone: 'Question JSON downloaded.', importDone: 'Questions imported successfully.', noQuestions: 'No questions found.',
    howClassic: 'Classic: alternate guesses during three timed rounds. Correct answers score survey points; wrong answers lose the configured penalty.', howTraditional: 'Traditional: face off, choose Play/Pass, find answers, three strikes trigger one steal attempt.', howFast: 'Fast Money: each player answers the same five questions once. The second player cannot repeat an equivalent answer.', howOnline: 'Online Classic: the server chooses questions, validates guesses, and synchronizes the board and scores.',
    createRoom: 'Create Room', joinRoom: 'Join Room', roomCode: 'Room Code', copyCode: 'Copy Code', copyLink: 'Copy Invite Link', waitingOpponent: 'Waiting for opponent…', connected: 'Connected', disconnected: 'Disconnected', reconnecting: 'Reconnecting…', roomNotFound: 'Room not found.', roomFull: 'Room is full.', startOnline: 'Start Online Match', leaveRoom: 'Leave Room', onlineTurn: 'Turn: {name}',
    loading: 'Loading…', error: 'Something went wrong', retry: 'Retry', saved: 'Saved.', invalidData: 'Invalid data.', confirmDelete: 'Delete this custom question?', confirmQuit: 'Quit the current match? Progress will be lost.', copied: 'Copied.',
    modeUnavailable: 'This mode is unavailable.', aiThinking: 'AI is thinking…', revealRemaining: 'Revealing remaining answers…', finalScore: 'Final Score', accuracy: 'Accuracy', roundsWon: 'Rounds Won'
  },
  ar: {
    title: 'تحدي الاستطلاع', tagline: 'فكّر بسرعة وخمّن إجابة الجمهور', play: 'العب', howToPlay: 'طريقة اللعب', questionBank: 'بنك الأسئلة', settings: 'الإعدادات', profile: 'الإحصائيات',
    back: 'رجوع', home: 'القائمة الرئيسية', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', continue: 'متابعة', start: 'ابدأ', rematch: 'إعادة المباراة', nextRound: 'الجولة التالية',
    classic: 'كلاسيك', classicDesc: 'ثلاث جولات. اجمع أكبر عدد من نقاط إجابات الاستطلاع.', traditional: 'تقليدي', traditionalDesc: 'مواجهة، ثلاثة أخطاء، ثم فرصة سرقة.', fastMoney: 'المال السريع', fastMoneyDesc: 'خمسة أسئلة سريعة لكل لاعب.', vsAI: 'ضد الذكاء الاصطناعي', vsAIDesc: 'تحدَّ خصمًا آليًا.', local2: 'لاعبان محليان', local2Desc: 'تناوبا على جهاز واحد.', online: 'كلاسيك أونلاين', onlineDesc: 'أنشئ غرفة خاصة أو انضم إليها.',
    matchSetup: 'إعداد المباراة', player1: 'اللاعب 1', player2: 'اللاعب 2', teamA: 'الفريق أ', teamB: 'الفريق ب', name: 'الاسم', roundTime: 'وقت الجولة', seconds: 'ثانية', difficulty: 'صعوبة الذكاء الاصطناعي', easy: 'سهل', medium: 'متوسط', hard: 'صعب', startMatch: 'ابدأ المباراة',
    round: 'الجولة', score: 'النقاط', time: 'الوقت', turn: 'دور {name}', question: 'السؤال', typeAnswer: 'اكتب إجابتك…', submit: 'إرسال', pause: 'إيقاف مؤقت', resume: 'متابعة', quit: 'خروج',
    correct: 'إجابة صحيحة!', wrong: 'إجابة خاطئة', duplicate: 'تم اكتشافها مسبقًا!', empty: 'اكتب إجابة أولًا.', topAnswer: 'أفضل إجابة!', timeUp: 'انتهى الوقت!', roundComplete: 'انتهت الجولة', winner: 'الفائز', tie: 'تعادل!', suddenDeath: 'جولة فاصلة', goodGame: 'لعبة جميلة!',
    faceOff: 'المواجهة', faceOffPrompt: '{team}، أدخل إجابة المواجهة.', playChoice: 'العب', passChoice: 'مرّر', choosePlayPass: 'اختر اللعب أو التمرير', strikes: 'الأخطاء', steal: 'فرصة سرقة!', stealPrompt: 'إجابة واحدة، فرصة واحدة.', stealSuccess: 'تمت السرقة!', stealFailed: 'فشلت السرقة!', roundPot: 'نقاط الجولة',
    fmIntro: 'خمسة أسئلة. إجابة واحدة لكل لاعب في كل سؤال.', fmQuestion: 'السؤال {current} من {total}', fmPlayerComplete: 'انتهى دور اللاعب الأول', passDevice: 'سلّم الجهاز للاعب الثاني ثم اضغط جاهز.', ready: 'جاهز', tryAnother: 'نفس الإجابة — جرّب إجابة أخرى.', results: 'النتائج', total: 'المجموع', bonus200: '+200 نقطة!',
    language: 'اللغة', english: 'English', arabic: 'العربية', sound: 'المؤثرات الصوتية', music: 'الموسيقى', virtualKeyboard: 'لوحة مفاتيح داخل اللعبة', reducedMotion: 'تقليل الحركة', on: 'تشغيل', off: 'إيقاف', resetStats: 'إعادة ضبط الإحصائيات',
    gamesPlayed: 'المباريات', wins: 'الفوز', losses: 'الخسارة', highestScore: 'أعلى نتيجة', averageScore: 'متوسط النقاط', correctGuesses: 'إجابات صحيحة', wrongGuesses: 'إجابات خاطئة',
    qbSearch: 'ابحث في الأسئلة…', allCategories: 'كل التصنيفات', addQuestion: 'إضافة سؤال', importJSON: 'استيراد JSON', exportJSON: 'تصدير JSON', builtIn: 'مدمج', custom: 'مخصص', edit: 'تعديل', delete: 'حذف', duplicateQuestion: 'نسخ', answers: 'إجابات', valid: 'صالح',
    editorTitle: 'محرر السؤال', questionId: 'معرّف السؤال', category: 'التصنيف', englishQuestion: 'السؤال بالإنجليزية', arabicQuestion: 'السؤال بالعربية', englishAnswer: 'الإجابة بالإنجليزية', arabicAnswer: 'الإجابة بالعربية', points: 'النقاط', aliasesEn: 'مرادفات الإنجليزية (بفواصل)', aliasesAr: 'مرادفات العربية (بفواصل)', addAnswer: 'إضافة إجابة', deleteAnswer: 'حذف الإجابة',
    importTitle: 'استيراد بنك أسئلة JSON', importHelp: 'الصق مصفوفة من كائنات الأسئلة. سيتم التحقق من البيانات قبل حفظها.', import: 'استيراد', exportDone: 'تم تنزيل ملف الأسئلة.', importDone: 'تم استيراد الأسئلة بنجاح.', noQuestions: 'لا توجد أسئلة مطابقة.',
    howClassic: 'كلاسيك: يتناوب اللاعبان على التخمين خلال ثلاث جولات مؤقتة. الإجابة الصحيحة تضيف نقاط الاستطلاع والخاطئة تخصم العقوبة المحددة.', howTraditional: 'التقليدي: مواجهة أولًا، ثم لعب/تمرير، وبعد ثلاثة أخطاء يحصل الخصم على محاولة سرقة واحدة.', howFast: 'المال السريع: يجيب كل لاعب عن نفس خمسة الأسئلة مرة واحدة، ولا يستطيع اللاعب الثاني تكرار إجابة مكافئة لإجابة الأول.', howOnline: 'كلاسيك أونلاين: الخادم يختار الأسئلة ويتحقق من الإجابات ويزامن اللوحة والنقاط.',
    createRoom: 'إنشاء غرفة', joinRoom: 'انضمام لغرفة', roomCode: 'رمز الغرفة', copyCode: 'نسخ الرمز', copyLink: 'نسخ رابط الدعوة', waitingOpponent: 'بانتظار الخصم…', connected: 'متصل', disconnected: 'غير متصل', reconnecting: 'جاري إعادة الاتصال…', roomNotFound: 'الغرفة غير موجودة.', roomFull: 'الغرفة ممتلئة.', startOnline: 'ابدأ مباراة أونلاين', leaveRoom: 'مغادرة الغرفة', onlineTurn: 'الدور: {name}',
    loading: 'جارٍ التحميل…', error: 'حدث خطأ', retry: 'إعادة المحاولة', saved: 'تم الحفظ.', invalidData: 'بيانات غير صالحة.', confirmDelete: 'هل تريد حذف هذا السؤال المخصص؟', confirmQuit: 'هل تريد الخروج من المباراة؟ سيُفقد التقدم الحالي.', copied: 'تم النسخ.',
    modeUnavailable: 'هذا النمط غير متاح.', aiThinking: 'الخصم يفكر…', revealRemaining: 'جارٍ كشف الإجابات المتبقية…', finalScore: 'النتيجة النهائية', accuracy: 'الدقة', roundsWon: 'الجولات الفائزة'
  }
};

let currentLang = 'en';
export function setLanguage(lang) { currentLang = lang === 'ar' ? 'ar' : 'en'; }
export function getLanguage() { return currentLang; }
export function t(key, vars = {}, lang = currentLang) {
  let value = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}
export function applyDocumentLanguage(lang = currentLang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
export function getStrings(lang = currentLang) { return STRINGS[lang]; }
