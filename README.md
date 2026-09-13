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


## V2 + V7 Features test build
This package keeps V2 as the base and backports the additional V7 capabilities: room names, invite landing flow, spectator support, stronger online action processing, guess busy protection, richer logs, team/spectator rosters, picked-card privacy, active-turn tint, responsive improvements, reduced-motion support, animations, confetti, Web Audio sound, mute and volume controls.

The V2 gameplay rule that requires at least one guess before a voluntary End Turn is intentionally preserved.

## V10 — Revealed card artwork

Version v10 replaces the revealed-card “Picked / تم الاختيار” display in Operative View with one of the 25 supplied card artworks. A new round shuffles all 25 artworks and assigns one unique artwork to each board position. `Reset Round` creates a fresh round and reshuffles the artwork positions again. The image assignment is part of the synchronized board state so all players in the same online room see the same image after the same card is revealed.


## V11 — Original artwork with runtime team-colour overlays

V11 keeps the v10 gameplay unchanged and replaces the reveal artwork source with the untouched PNG files supplied in `Normal.zip`. The original image files are stored in `assets/cards/` and are displayed without cropping, resizing, pre-colouring, or destructive editing. When a card is revealed, CSS adds a full-cover solid colour overlay based on its role: red, blue, beige (neutral), or black (assassin). The blend happens only at display time, so the source image bytes remain unchanged.


## V12

V12 removes the reveal-time colour overlay effect from V11. Cards now keep the original unedited PNG image and use a frame-only status style: white border before reveal, then a coloured border after reveal (red, blue, beige for neutral, black for assassin).


## V13

V13 fixes the spymaster board style. Unrevealed cards in spymaster view now show only the classic role colours (red, blue, neutral beige, assassin gray/black) with no reveal image and no V12 white outer frame. After a card is revealed, the original image appears with the role-coloured frame.
