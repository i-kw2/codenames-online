# Survey Showdown / تحدي الاستطلاع

A complete bilingual Arabic/English survey-answer game designed for Visual Studio Code. It uses original branding, original synthetic survey questions, and does **not** include Family Feud logos, official question databases, proprietary artwork, or proprietary audio.

## Included modes

- **Classic Local 2 Player** — 3 timed rounds, alternating guesses, points for correct answers, configurable wrong-answer penalty.
- **VS AI** — Easy / Medium / Hard AI with randomized delay and imperfect accuracy.
- **Traditional** — Face-Off → Play/Pass → Board → 3 Strikes → Steal → Round Result, with round multipliers.
- **Fast Money** — 5 questions per player, one answer per question, duplicate opponent answers rejected, 200+ combined-point celebration.
- **Online Classic (optional Node server)** — private 6-character rooms using Socket.IO; server chooses questions, validates answers and scores, and does not send hidden online answers until revealed.

## Core features

- English + Arabic with live LTR/RTL switching.
- 60 built-in original bilingual survey questions, 3–8 answers each.
- Arabic normalization: diacritics/tatweel removal, Alef normalization, ى→ي and controlled letter normalization.
- English normalization + aliases + controlled Levenshtein/token fuzzy matching.
- Duplicate-answer prevention.
- Fisher–Yates shuffled question queue.
- Reusable timer with warning/danger states.
- Game state machine rather than overlapping UI booleans.
- LocalStorage settings, custom questions and statistics.
- Question Bank with search/filter, add/edit/delete custom questions, duplicate built-in questions, import/export JSON and validation.
- Web Audio synthesized sound effects; no proprietary audio files required.
- Optional virtual keyboard for English/Arabic.
- Responsive layout for phones, tablets and desktops.
- `prefers-reduced-motion` support and visible focus states.
- VS Code extension recommendation for Live Server.

---

# Run in Visual Studio Code — offline/local modes

This is the easiest way and **does not require Node.js or npm**.

1. Extract the project ZIP.
2. Open **Visual Studio Code**.
3. Choose **File → Open Folder** and select the `survey-showdown` folder.
4. VS Code should recommend the **Live Server** extension. Install it if you do not already have it.
5. Open `index.html`.
6. Right-click inside the file and choose **Open with Live Server**, or press **Go Live** in the VS Code status bar.
7. Your browser should open a URL similar to:

   `http://127.0.0.1:5500/index.html`

Do not open `index.html` directly as a `file://` URL. ES modules and localStorage behavior are more reliable when served over HTTP.

---

# Run with Online Classic

Online mode requires **Node.js 20+**.

1. Install Node.js if needed.
2. Open the project folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

```bash
npm install
```

5. Then run:

```bash
npm start
```

6. Open:

`http://localhost:3000`

7. On one browser/device choose **Online Classic → Create Room**.
8. On the other choose **Online Classic → Join Room** and enter the 6-character code.

You can also launch `server.js` using the included VS Code Run/Debug configuration named **Run Survey Showdown Online Server** after dependencies are installed.

## Important online architecture

The online server keeps its own private question bank under `server/onlineQuestions.js`. Express serves only `index.html`, `/css`, `/js`, and `/assets`, so that server-only online answers are not served to browsers. The client receives hidden slot counts and only receives answer text/points when the server reveals them.

A reconnecting browser uses a stable local player token and may rejoin the room within roughly 20 seconds before the disconnected player is removed.

---

# Project structure

```text
survey-showdown/
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── assets/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── audio.js
│   ├── config.js
│   ├── game.js
│   ├── i18n.js
│   ├── matching.js
│   ├── online.js
│   ├── questions.js
│   ├── storage.js
│   └── ui.js
├── server/
│   └── onlineQuestions.js
├── tests/
│   └── core.test.mjs
├── index.html
├── server.js
├── package.json
├── README.md
├── RESEARCH.md
├── QA_REPORT.md
└── LICENSE
```

# Testing

Core tests use Node's built-in test runner and do not require Express or Socket.IO:

```bash
node --test tests/core.test.mjs
```

After `npm install`, the shortcut also works:

```bash
npm test
```

# Editing the main configuration

Open `js/config.js` to change values such as:

- Classic rounds
- Wrong guess penalty
- Traditional multipliers
- Fast Money question count/target
- AI difficulty behavior
- Online round time constant

# Adding questions

Use the in-game **Question Bank** screen for custom questions. Built-in questions are intentionally immutable from the manager; you can duplicate one and edit the custom copy.

Question schema:

```json
{
  "id": "travel_example_001",
  "category": "travel",
  "question": {
    "en": "Name something people take on a trip.",
    "ar": "اذكر شيئًا يأخذه الناس في رحلة."
  },
  "answers": [
    {
      "id": "travel_example_001_a1",
      "text": { "en": "Passport", "ar": "جواز السفر" },
      "points": 30,
      "aliases": {
        "en": ["Passport"],
        "ar": ["جواز السفر", "الجواز"]
      }
    }
  ]
}
```

Every question must have 3–8 answers. Import validates missing translations, duplicated IDs, answer count, aliases and point values before replacing custom data.

# Known limitations

- The supplied 60-question bank is **synthetic survey-style content**, not actual statistically sampled survey data.
- Online Classic uses strict normalized aliases on the server rather than the full client-side fuzzy Levenshtein matcher. This is deliberate to reduce false positives in competitive online play.
- Online mode is a private-room Classic implementation; online Traditional and online Fast Money are not implemented.
- Uploaded avatars, social friends/inbox, tournament economy, and real-money systems are intentionally not included.
- Browser-level visual automation could not be completed in the build environment; the QA report distinguishes static/unit checks from manual visual checks recommended in VS Code.

# Intellectual-property note

This project is inspired by the general mechanics of survey-answer game shows. The name **Survey Showdown**, visual styling, source code and question data in this project are original. Avoid adding official Family Feud logos, audio, artwork or copied official question databases unless you have the necessary rights.
