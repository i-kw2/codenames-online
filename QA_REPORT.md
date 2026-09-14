# Survey Showdown — QA Report

## Project status

Core offline game: **implemented**  
Optional Online Classic server: **implemented; dependency installation not executed successfully in the build environment due npm install timeout**

## Automated checks completed

### JavaScript syntax audit

`node --check` passed for the application modules and server source, including:

- `js/app.js`
- `js/game.js`
- `js/questions.js`
- `js/ui.js`
- `js/i18n.js`
- `js/matching.js`
- `js/storage.js`
- `js/audio.js`
- `js/online.js`
- `server.js`
- `server/onlineQuestions.js`

### Translation-key audit

A static audit extracted direct `t('...')` usages from the UI/controller files and compared them with both dictionaries.

Result: **115 referenced keys; 0 missing in English; 0 missing in Arabic.**

### Question-bank validation

Built-in bank: **60 questions**.  
Validation result: **0 errors**.

Each built-in question includes English text, Arabic text and 3–8 answers with point values and aliases arrays.

### Core tests

Command:

```bash
node --test tests/core.test.mjs
```

Result: **8 passed / 0 failed**.

Covered cases:

1. At least 60 valid bilingual built-in questions.
2. Arabic diacritic/Alef/Ya normalization.
3. Known English and Arabic aliases.
4. Short-word fuzzy false-positive prevention (`car` vs `card`).
5. Classic score awarded once and duplicate answer blocked.
6. Wrong Classic answer cannot reduce a zero score below zero.
7. Traditional mode reaches Steal after three strikes.
8. Fast Money blocks an equivalent Player 2 answer and does not advance the question index.

### Static HTTP smoke check

The project was served through a local Python HTTP server and returned HTTP 200 for:

- `index.html`
- `css/styles.css`
- all primary browser JS modules

This verifies file paths/import targets are present when served over HTTP.

## Test limitation

A Chromium binary was present in the build environment, but headless page rendering did not complete reliably because the container's Chromium/DBus environment hung. Therefore I do **not** claim a completed automated visual/browser interaction test.

Recommended local visual checks in VS Code/Chrome:

- 375×812, 390×844, 430×932 mobile sizes
- 768px tablet
- 1024px and 1440px desktop
- English and Arabic on every main screen
- native mobile keyboard open during gameplay
- Online Classic in two separate browser profiles after `npm install && npm start`

## npm limitation

`npm install --no-audit --no-fund` was attempted in the build environment and timed out. This prevented a runtime Socket.IO/Express integration test here. The online source files passed syntax checks, and the dependency versions are declared in `package.json`.

Offline/local modes do not require npm dependencies and run through Live Server.

## Known functional limitations

- Online Traditional and Online Fast Money are not implemented.
- Online server matching intentionally uses strict normalized aliases instead of client fuzzy distance matching.
- No real survey backend is included; point values are synthetic.
- No image upload/avatar file storage; initials avatars are generated automatically.
- No tournament, social friends/inbox, currency economy or real-money purchase system.

## Bug-audit items checked

- Missing direct i18n keys: none found.
- Question IDs: built-in validation passed.
- Duplicate scoring for a revealed Classic answer: tested and blocked.
- Empty answer handling: engine returns `empty`; no score/strike applied.
- Timer floor: timer uses `Math.max(0, …)` and expiration clears the interval.
- Multiple timers: starting/stopping phases clears previous interval.
- AI answer after round end: AI timeout is cleared on phase exit/destroy.
- Invalid custom JSON: parsed and validated before storage replacement.
- Unsafe player-name HTML injection: rendered names are HTML-escaped in UI templates.
- Server hidden-answer exposure: server-only online question file is not mounted as a static directory.
