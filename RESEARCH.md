# Survey Showdown — Research and Architecture Notes

## Game-rule findings used

Family Feud Live's official help material states that its Classic mode uses three rounds, one question per round, awards points for correct guesses within the time limit, and removes points for incorrect guesses. It describes Fast Money as five questions, one answer per player per question, requiring another answer when a player repeats the opponent's answer, with the highest overall score winning. The same help material says the game uses synonyms when evaluating semantically equivalent responses.

Sources:

1. Ludia Help Center, “Introduction — Family Feud Live Help Center.” https://ludia.helpshift.com/hc/en/29-family-feud-live/faq/2668-introduction/
2. Ludia Help Center, “My answer was correct but I wasn't credited for it! Why?” https://ludia.helpshift.com/hc/en/29-family-feud-live/faq/2673-my-answer-was-correct-but-i-wasn-t-credited-for-it-why/
3. Ludia Help Center, “How is the winner determined.” https://ludia.helpshift.com/hc/en/29-family-feud-live/faq/2672-how-is-the-winner-determined/

These were treated as gameplay references only. The project uses an original title, original visual styling and original synthetic question data.

## GitHub research and licensing decision

Two older Family-Feud-style HTML/JavaScript repositories were reviewed for architectural ideas. One pure HTML5 project explicitly uses a central changed-state model and separates a control view from the game view, which supports the decision to centralize game state. That repository is GPL-3.0, so its source code was **not copied** into this project.

The official Socket.IO repositories and minimal examples use the MIT license. They support the room/event architecture used here, but this project's room and game logic was written independently.

Sources:

4. jasonfill/family-feud, GitHub, GPL-3.0. https://github.com/jasonfill/family-feud
5. dannyjanani/Family-Feud, GitHub. https://github.com/dannyjanani/Family-Feud
6. socketio/socket.io, GitHub, MIT. https://github.com/socketio/socket.io
7. socketio/socket.io-minimal-example, GitHub, MIT. https://github.com/socketio/socket.io-minimal-example
8. socketio/chat-example, GitHub, MIT. https://github.com/socketio/chat-example

## Browser-platform findings used

The Web Storage API is appropriate for small preferences, custom question data and statistics that need to persist between browser sessions. MDN notes that localStorage is origin-scoped and persists across browser restarts, while direct `file:` URL behavior is not something applications should rely on. This is why the README explicitly recommends VS Code Live Server rather than double-clicking `index.html`.

The Web Audio API is used to synthesize lightweight original tones instead of shipping copyrighted audio files. Accessibility design uses `aria-live` for concise dynamic feedback and CSS `prefers-reduced-motion` to reduce motion when the operating system requests it.

Sources:

9. MDN, “Using the Web Storage API.” https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
10. MDN, “Window: localStorage property.” https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
11. MDN, “Web Audio API.” https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
12. MDN, “ARIA live regions.” https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
13. MDN, “ARIA: aria-live attribute.” https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live

## Architecture decisions

### State-first game engine

The game engine owns scores, active player, question, revealed answers, timer, phase, strikes, round pot and Fast Money responses. The UI is derived from that state. This prevents independent buttons from mutating scores or advancing phases without validation.

Key phases include Classic `round_intro → round_active → round_result → game_over`; Traditional `faceoff_a → faceoff_b → play_pass → team_play → steal → round_result`; and Fast Money `fm_answering → fm_transition → fm_answering → fm_results → game_over`.

### Bilingual data rather than translated UI only

Every question and every accepted answer contains English and Arabic text. This lets the same logical question remain active if the language is switched during a match. UI strings are stored separately in the i18n dictionary.

### Matching pipeline

Offline matching order is exact normalized canonical text, exact normalized alias, token comparison, then conservative Levenshtein similarity. Short strings use a much stricter threshold to prevent mistakes such as accepting `card` for `car`. Arabic normalization removes diacritics/tatweel and normalizes selected letter forms without aggressively collapsing distinct letters.

### Online server authority

The online server stores its question answers, scores, active turn and timer. A browser submits a guess; the server validates it and sends only the resulting public state. The server-only online question file is not exposed by the Express static routes. A 20-second disconnect grace period is included through stable player tokens.

### No copied official survey database

The built-in 60-question client bank and the separate online bank are synthetic survey-style content. Their point values are designed for game balance and do not claim to represent actual survey percentages.
