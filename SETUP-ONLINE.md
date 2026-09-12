# Codenames Online V2 — Setup for Beginners

هذه التعليمات مكتوبة لشخص لم يسبق له استخدام Firebase أو GitHub Pages.

## النتيجة النهائية

بعد الإعداد مرة واحدة، موقعك سيكون له رابط عام مثل:

```text
https://YOUR-GITHUB-USERNAME.github.io/codenames-online/
```

أنت تدخل الموقع وتضغط **Create Room**. سيعطيك Room Code ورابط مثل:

```text
https://YOUR-GITHUB-USERNAME.github.io/codenames-online/?room=A7K92M
```

ترسل الرابط لربعك. كل واحد يكتب اسمه ويدخل نفس الـLobby. أنت الـHost وتوزع الفرق والقادة ثم تضغط **Start Online Game**.

---

# PART 1 — افتح المشروع في VS Code

1. فك ضغط ملف المشروع.
2. افتح **Visual Studio Code**.
3. اختر **File → Open Folder**.
4. اختر مجلد `codenames-bilingual-v2` (أو اسم المجلد الذي فكيت ضغطه).
5. تأكد أن `index.html` موجود في جذر المجلد.

لا تحتاج `npm install` ولا Node.js لهذه النسخة.

---

# PART 2 — أنشئ Firebase Project

1. افتح Firebase Console:
   - https://console.firebase.google.com/
2. اضغط **Create a project**.
3. اختر اسماً، مثلاً:

```text
khaled-codenames
```

4. Google Analytics غير مطلوب للعبة؛ تستطيع إيقافه إذا لم تحتجه.
5. أكمل إنشاء المشروع.

---

# PART 3 — أضف Web App إلى Firebase

داخل Firebase Project:

1. من Project Overview اضغط أيقونة **Web `</>`**.
2. App nickname مثلاً:

```text
Codenames Web
```

3. لا تحتاج Firebase Hosting لأننا سنستخدم GitHub Pages.
4. اضغط **Register app**.
5. Firebase سيعطيك object يشبه:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

> إذا لم يظهر `databaseURL` الآن، طبيعي. أنشئ Realtime Database في الجزء التالي ثم ارجع إلى Project Settings → Your apps → SDK setup and configuration وخذ config مرة ثانية.

---

# PART 4 — فعّل Anonymous Authentication

1. في Firebase افتح **Authentication**.
2. اضغط **Get started** إذا ظهرت.
3. افتح **Sign-in method**.
4. اختر **Anonymous**.
5. فعّله **Enable** ثم **Save**.

بهذا ربعك لا يحتاجون Email أو Password؛ كل جهاز يحصل على UID مؤقت تلقائياً.

## مهم للتجربة المحلية

في Firebase Authentication افتح **Settings → Authorized domains**.

إذا كنت ستجرب عبر Live Server، أضف:

```text
localhost
```

Firebase لا يضيف `localhost` تلقائياً للمشاريع الجديدة دائماً، لذلك هذه الخطوة تمنع مشاكل التطوير المحلي.

بعد نشر الموقع على GitHub Pages، أضف أيضاً دومين GitHub الخاص بك، مثلاً:

```text
YOUR-GITHUB-USERNAME.github.io
```

---

# PART 5 — أنشئ Realtime Database

1. في Firebase افتح **Realtime Database**.
2. اضغط **Create Database**.
3. اختر Location مناسبة لك.
4. اختر **Start in locked mode** إذا ظهر الخيار.
5. أكمل الإنشاء.

لا تترك Database في Test Mode للموقع المنشور.

---

# PART 6 — ضع Security Rules الجاهزة

داخل المشروع عندك ملف:

```text
firebase-rules.json
```

1. افتحه في VS Code.
2. انسخ محتواه بالكامل.
3. Firebase Console → **Realtime Database → Rules**.
4. احذف القواعد الموجودة.
5. الصق محتوى `firebase-rules.json`.
6. اضغط **Publish**.

هذه القواعد هي التي تمنع اللاعب العادي من قراءة Secret Key وتمنع اللاعبين من تعديل Game State مباشرة. الـHost هو الذي يكتب حالة اللعبة العامة، والـSpymasters فقط (بالإضافة إلى الـHost لأسباب المعالجة) يمكنهم قراءة مسار الأدوار السري.

---

# PART 7 — الصق Firebase Config داخل المشروع

في VS Code افتح:

```text
js/firebase-config.js
```

ستجد placeholders مثل:

```js
window.CODENAMES_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

استبدل **الكائن بالكامل** بالبيانات التي أعطاك Firebase إياها، لكن أبقِ الاسم:

```js
window.CODENAMES_FIREBASE_CONFIG = {
  // paste your real values here
};
```

احفظ الملف بـ `Ctrl + S`.

ملاحظة: Firebase web config ليس password. الحماية الحقيقية تأتي من Authentication وSecurity Rules. لا تضع Service Account private key داخل هذا المشروع أبداً.

---

# PART 8 — جرّب Online Multiplayer محلياً

## ثبّت Live Server

1. VS Code → Extensions.
2. ابحث عن **Live Server**.
3. ثبته.
4. افتح `index.html`.
5. Right-click → **Open with Live Server**.

استخدم عنوان `localhost` إذا أمكن، مثل:

```text
http://localhost:5500/
```

إذا فتح Live Server باستخدام `127.0.0.1` وواجهت Firebase Auth مشكلة، افتح نفس المنفذ باستبدال `127.0.0.1` بـ `localhost` في شريط العنوان.

## اختبار سريع على نفس الكمبيوتر

1. افتح الموقع في Chrome عادي.
2. اكتب اسمك واضغط **Create Room**.
3. انسخ Invite Link.
4. افتح **Incognito Window**.
5. الصق Invite Link.
6. اكتب اسم لاعب آخر واضغط Join Room.

كرر باستخدام متصفحات/Incognito حتى يكون لديك 4 لاعبين للاختبار، أو جرّبه مباشرة مع ربعك بعد النشر.

---

# PART 9 — ارفع المشروع إلى GitHub

إذا ما عندك حساب GitHub، أنشئ حساباً من:

https://github.com/

## أسهل طريقة بدون أوامر Git

1. GitHub → اضغط **New repository**.
2. الاسم مثلاً:

```text
codenames-online
```

3. اجعله **Public** إذا كنت تريد أسهل نشر عبر GitHub Pages.
4. اضغط **Create repository**.
5. داخل Repository اختر **Add file → Upload files**.
6. ارفع محتويات مجلد المشروع كاملة بحيث يظهر `index.html` في جذر الـRepository، ومعه:

```text
index.html
css/
js/
tests/
README.md
SETUP-ONLINE.md
firebase-rules.json
```

7. اضغط **Commit changes**.

---

# PART 10 — فعّل GitHub Pages

داخل Repository:

1. افتح **Settings**.
2. من القائمة اليسار اختر **Pages**.
3. عند **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
4. اضغط **Save**.

بعد اكتمال النشر، GitHub يعطيك رابطاً شبيهاً بـ:

```text
https://YOUR-GITHUB-USERNAME.github.io/codenames-online/
```

افتح الرابط وتأكد أن الصفحة تظهر.

ثم ارجع إلى Firebase Authentication → Settings → Authorized domains وأضف:

```text
YOUR-GITHUB-USERNAME.github.io
```

---

# PART 11 — شلون تلعبون فعلياً

## أنت الـHost

1. افتح رابط الموقع.
2. اكتب اسمك.
3. اضغط **Create Room**.
4. اضغط **Copy Invite Link**.
5. أرسل الرابط في WhatsApp/Discord.

## ربعك

1. يفتحون الرابط.
2. Room Code سيكون موجوداً تلقائياً في الرابط.
3. كل شخص يكتب اسمه.
4. يضغط **Join Room**.

## في Lobby

أنت فقط تقدر:

- تغير Team لكل لاعب.
- تختار Spymaster / Operative.
- تعمل Randomize Teams.
- تعمل Randomize Spymasters.
- تغير لغة البطاقات.
- تفعل Strict Clues.
- تفعل Expert Rules.
- Kick لأي لاعب.
- Start Online Game.

أسهل شيء أول مرة:

1. انتظر إلى أن يدخل 4 لاعبين أو أكثر.
2. اضغط **Randomize Teams**.
3. سيختار البرنامج أيضاً Spymaster واحد لكل فريق.
4. اضغط **Start Online Game**.

---

# كيف تعمل النسخة Online؟

كل لاعب لديه Firebase Anonymous UID مختلف.

```text
Player Device
     ↓
Anonymous Auth
     ↓
Firebase Realtime Database
     ↓
Shared Room
```

اللاعب العادي لا يغير Game State مباشرة. عندما يضغط بطاقة، يرسل Action للغرفة:

```text
GUESS card-12
```

جهاز الـHost يستقبل الطلب، يطبق قواعد اللعبة، ثم يكتب النتيجة العامة إلى Firebase. جميع الأجهزة تستقبل التغيير فوراً.

```text
Operative → Guess Request → Firebase → Host
                                      ↓
                                Game Engine
                                      ↓
All Players ← Public Game State ← Firebase
```

Secret role map محفوظ في مسار منفصل. الـOperatives لا يملكون read permission لهذا المسار.

## ملاحظة عن الـHost

هذه النسخة **Host-authoritative client architecture** وليست Dedicated Server. الـHost يحتاج الوصول البرمجي إلى Secret Map حتى يحسم التخمينات؛ لذلك مستخدم الـHost المتقدم تقنياً يستطيع نظرياً رؤية السر من Developer Tools حتى لو كان Operative. واجهة اللعبة نفسها لا تعرض المفتاح له إذا لم يكن Spymaster.

إذا أردت مستقبلاً حماية كاملة حتى من الـHost نفسه، انقل معالجة التخمين إلى trusted backend مثل Firebase Cloud Functions أو server خاص.

---

# إذا طلع خطأ

## `Firebase: setup required`

`js/firebase-config.js` ما زال يحتوي placeholders.

## `operation-not-allowed`

Anonymous Authentication غير مفعّل.

## `PERMISSION_DENIED`

غالباً Security Rules غير منشورة أو Room Code غير صحيح أو لاعب جديد يحاول الدخول بعد بدء اللعبة.

## اللعبة تعمل محلياً لكن Firebase Auth لا يعمل على Live Server

أضف `localhost` إلى:

```text
Firebase → Authentication → Settings → Authorized domains
```

وافتح الموقع باستخدام `http://localhost:PORT`.

## Invite Link يفتح الموقع لكن لا يدخل اللاعب تلقائياً

هذا مقصود: الكود يُملأ تلقائياً، لكن اللاعب يكتب اسمه ثم يضغط **Join Room**.

## Host صار Offline

اللاعبون يظلون يرون آخر Game State، لكن الأوامر الجديدة تتوقف حتى يرجع الـHost. افتح نفس الموقع من جهاز الـHost مرة أخرى وادخل الغرفة بنفس المتصفح/Anonymous session.

---

# ملفات Online الجديدة

```text
js/firebase-config.js   ← تلصق Firebase config هنا
js/online.js            ← Rooms, Lobby, Host sync, Actions, Presence
firebase-rules.json     ← Security Rules الجاهزة
SETUP-ONLINE.md         ← هذا الدليل
```

لا تعدّل `online.js` أو `firebase-rules.json` في البداية. أول شيء فقط جهز Firebase والصق config ثم جرّب.
