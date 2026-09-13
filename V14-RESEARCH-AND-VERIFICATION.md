# V14 — Research, Implementation, and Verification Notes

## الهدف

هذه النسخة مبنية فوق V13 كما هي، مع اعتبار محرك اللعبة والاتصال الحاليين خط أساس مستقر. التعديل في V14 يركز على إعادة تصميم Lobby وإضافة Settings / Quick Guide / Spectators وسلوك الانضمام للأدوار، مع أقل تغيير ممكن في منطق المباراة الأساسي.

## مصادر المتطلبات المرفقة

تمت مراجعة الملفات التي أرفقها صاحب المشروع ومطابقة المتطلبات المتكررة بينها قبل التنفيذ:

- `Pasted markdown (2).md` — وصف Lobby / Pre-Game UI وسلوك الفريقين والإعدادات.
- `Pasted markdown (3).md` — مخطط X/Y المرجعي للعناصر الرئيسية على شاشة 2048px.
- `Pasted markdown (4).md` و`Pasted markdown (5).md` — مواصفات Settings Modal (نسختان متطابقتان).
- `Pasted markdown (6).md` و`Pasted markdown (7).md` — مواصفات Quick Guide (نسختان متطابقتان).
- `Pasted markdown (8).md` — مواصفات Spectators وسلوك الدخول/الانتقال بين الأدوار.
- `Pasted text.txt` — مواصفات Codenames الثنائية اللغة ومنطق اللعبة العام.

## قرارات التنفيذ

### 1) الحفاظ على V13

لم تتم إعادة كتابة محرك Codenames أو آلية Firebase الأساسية. تم تركيب طبقة V14 حول الموجود، واستخدام الواجهات الحالية حيث أمكن. الهدف هو تقليل احتمالية إدخال Regression في قواعد اللعبة التي كانت تعمل في V13.

### 2) Lobby المرجعي

تم بناء Lobby بثلاثة أعمدة على الشاشات الكبيرة:

- Blue Team يسارًا.
- Game Settings في الوسط.
- Red Team يمينًا.

تم تثبيت هذا الترتيب فيزيائيًا حتى عند استخدام الواجهة العربية RTL، لأن الأزرق/الأحمر هنا جزء من تكوين اللعبة وليس مجرد ترتيب نصي.

### 3) Spectators

- المستخدم الجديد يدخل كـ `spectator` افتراضيًا.
- يظهر بصورة مصغرة دائرية والاسم تحتها.
- يظهر تاج على Host.
- الانتقال إلى Team/Role يزيله من Spectators ويضيفه للقسم الصحيح Realtime.
- Spectator لا يحصل على Secret Key؛ قراءة `secret` في قواعد Firebase تبقى للـHost أو Spymaster فقط.

### 4) Team Roles

- Blue/Red Operatives يسمحان بأكثر من لاعب.
- Blue/Red Spymaster يسمحان بمقعد واحد لكل فريق من واجهة V14.
- الضغط على JOIN TEAM يغير `team` + `role` معًا.
- الضغط على نفس الدور الحالي يعيد المستخدم إلى Spectators.
- Lock teams يمنع أعضاء الغرفة العاديين من تغيير الفريق أو الدور.

### 5) Randomize Teams

تم تفسير `Randomize teams` كما ورد في المواصفات: توزيع المشاركين على Red/Blue بأعداد متقاربة، ثم يختار اللاعبون الـSpymasters يدويًا. لا يعين الزر قادة التجسس تلقائيًا.

### 6) Settings

أضيفت الأقسام:

- Admin
- Player
- Preferences
- Accessibility

إعدادات الغرفة (مثل Lock teams / Card language / Strict clues / Expert rules) تبقى مشتركة عبر Firebase. إعدادات العرض والصوت وإمكانية الوصول تبقى محلية للجهاز، حتى لا يؤثر اختيار مستخدم على الآخرين.

### 7) Quick Guide

Quick Guide عبارة عن Popover سياقي في أعلى اليمين ولا يغير Game State. يدعم:

- Host-aware / Player-aware text.
- GOT IT.
- RULES.
- Auto-show.
- إعادة إظهار الإرشادات من Preferences.

## تحقق Firebase Realtime Database

تمت مراجعة قواعد الكتابة وفق سلوك Firebase Realtime Database Rules الرسمي:

- قواعد `.read` و`.write` تمنح الصلاحية بصورة Cascading، ولا يمكن لقاعدة أعمق سحب صلاحية منحتها قاعدة أعلى.
- عمليات `update()` متعددة المسارات يتم تقييمها ذريًا ضمن قواعد الأمان.
- `.validate` تستخدم لفحص الشكل النهائي للبيانات بعد عملية الكتابة.
- `newData` يمثل البيانات كما ستصبح بعد نجاح الكتابة، وهذا مناسب للتحقق من انتقال `team` + `role` كحالة واحدة.

المراجع الرسمية:

1. Firebase, **Realtime Database Security Rules — Core Syntax**: https://firebase.google.com/docs/database/security/core-syntax
2. Firebase, **Realtime Database Security Rules API**: https://firebase.google.com/docs/reference/security/database

### تعديلات القواعد في V14

- `settings/teamsLocked` قيمة Boolean.
- اللاعب الجديد غير المضيف لا يستطيع إنشاء نفسه إلا كـ Spectator.
- اللاعب يستطيع تغيير `team` و`role` الخاصين به في Lobby إذا لم تكن الفرق مقفلة.
- `uid`, `isHost`, `joinedAt` لا يمكن للاعب تغييرها عبر self-assignment.
- Host يحتفظ بصلاحيات إدارة الغرفة.
- Secret Key لم يتم فتحه للمشاهدين.

**مهم:** يجب نشر `firebase-rules.json` الخاصة بـV14 على Firebase قبل تجربة JOIN TEAM/Lock Teams على النسخة المنشورة.

## التحقق الآلي

تم تنفيذ الفحوص التالية على نسخة V14:

- JavaScript syntax check لكل ملفات `js/*.js`.
- JSON parse لـ `firebase-rules.json`.
- فحص IDs في `index.html` للتأكد من عدم وجود IDs مكررة.
- فحص المراجع المحلية للملفات الثابتة في HTML.
- تشغيل اختبارات المشروع الموجودة (Game + UI): **38 / 38 passed**.

## ملاحظات توافق

- تم الاحتفاظ بعناصر Compatibility المخفية التي تعتمد عليها طبقة V13 Online حتى لا تنكسر الاستدعاءات القديمة.
- Music في Settings محفوظ كتفضيل محلي؛ V13 لا تحتوي أصلًا على Background Music asset/engine مخصص، لذلك لم تتم إضافة موسيقى جديدة من خارج المشروع حتى لا يتغير المنتج بشكل غير مطلوب. Effects مرتبطة بمستوى الصوت الموجود فعليًا.
- Disable seasonal themes محفوظ كتفضيل؛ لا توجد Seasonal Theme فعالة في V13 حاليًا، لذلك لا يغير مظهرًا غير موجود.

## النتيجة

V14 تضيف طبقة Lobby/Settings/Quick Guide/Spectators المطلوبة، وتحافظ على محرك V13 وقواعد Codenames الأساسية، مع تحديث Firebase Rules بما يلزم للسماح بالانضمام الذاتي الآمن للأدوار دون منح صلاحيات Host للمستخدم العادي.
