# Codenames Bilingual V2 — Local + Online Multiplayer

نسخة عربية/إنجليزية للطور الكلاسيكي، تعمل محلياً أو Online بغرف وروابط دعوة باستخدام Firebase Realtime Database.

## ابدأ من هنا

إذا هذه أول مرة تستخدم Firebase أو GitHub Pages، افتح:

**`SETUP-ONLINE.md`**

الدليل يشرح كل شيء خطوة بخطوة من إنشاء Firebase Project إلى إرسال Invite Link لربعك.

## أهم ميزات V2

- Create Room / Join Room.
- Invite URL يحمل Room Code في `?room=XXXXXX`.
- Host controls.
- Lobby حي لجميع اللاعبين.
- Anonymous Firebase Authentication؛ لا Email ولا Password مطلوب للاعبين.
- Realtime synchronization بين الأجهزة.
- Presence / Online / Offline status.
- Host-authoritative actions لمنع كل جهاز من تشغيل Game State مستقل.
- Secret role map منفصل عن public board.
- Secret path مقيد بالـSecurity Rules للـSpymasters والـHost.
- Reconnect لنفس Firebase anonymous user.
- Kick player من الـLobby.
- Randomize teams + spymasters.
- Reset Round وReturn to Lobby بواسطة الـHost.
- النسخة المحلية الأصلية ما زالت موجودة عبر زر **Play locally**.

## القواعد الموجودة

- 25 بطاقة، شبكة 5×5.
- Starting team: 9 agents.
- Other team: 8 agents.
- 7 Neutral.
- 1 Assassin.
- clue `n` يسمح حتى `n + 1` guesses ما دامت الإجابات صحيحة.
- Neutral ينهي الدور.
- Opponent agent ينهي الدور ويحسب للخصم.
- Assassin خسارة فورية.
- آخر Agent لأي فريق يحقق الفوز فوراً حتى لو كشفه الخصم.
- Strict bilingual clue matching.
- Clue challenge + invalid-clue penalty.
- Expert `Unlimited` و`0`.

## التشغيل المحلي فقط

لا يحتاج Node/npm. افتح المشروع بـVS Code، ثم `index.html` باستخدام Live Server. اضغط **Play locally**.

## Online setup

يحتاج إعداداً لمرة واحدة:

1. Firebase Project.
2. Anonymous Authentication.
3. Realtime Database.
4. نشر `firebase-rules.json`.
5. لصق Firebase config في `js/firebase-config.js`.
6. GitHub Pages للحصول على Public URL.

راجع `SETUP-ONLINE.md` للتفاصيل.

## بنية المشروع

```text
codenames-bilingual-v2/
├── index.html
├── README.md
├── SETUP-ONLINE.md
├── firebase-rules.json
├── css/
│   └── styles.css
├── js/
│   ├── firebase-config.js
│   ├── online.js
│   ├── words.js
│   ├── i18n.js
│   ├── utils.js
│   ├── game.js
│   ├── ui.js
│   └── app.js
└── tests/
    ├── test-runner.html
    ├── game.test.js
    └── ui.test.js
```

## Online architecture

```text
Players / Spymasters
        ↓ actions
Firebase Realtime Database
        ↓
Host browser → existing Game Engine
        ↓
publicGame state → Firebase → all players
        ↓
secret/roleMap → Host + Spymasters only
```

Firebase Security Rules are server-enforced. The public snapshot intentionally strips unrevealed `card.role` values. The secret role map is stored under a separate database path.

### Host security limitation

V2 intentionally uses the browser host as the authoritative rules engine so deployment stays simple and requires no custom backend. Because the Host must resolve guesses, Firebase Rules allow the Host account to read the secret map. The UI does not expose it when the Host is an Operative, but a technically sophisticated Host could inspect it. A future dedicated backend / Cloud Function would remove this trust requirement.

## Tests

Open:

```text
tests/test-runner.html
```

The core tests include classic rule behavior plus online serialization checks that verify unrevealed roles are removed from the public snapshot and restored only when a secret role map is applied.

## Firebase SDK

The online module uses Firebase's browser CDN modular SDK and does not require npm. An internet connection is required for Online mode because Firebase is a cloud service; Local mode still uses the existing vanilla HTML/CSS/JS engine.
