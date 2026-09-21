# V15 Deep Research Audit

## Executive result
V14's largest user-facing regression was architectural rather than game-rule related: it replaced V13's restrained cream/muted-red/muted-blue visual system with a black/neon lobby, and the new Settings entry point depended on a separate lobby state event. The supplied screenshot is consistent with that failure mode: the Quick Guide trigger renders, while the Admin / News / Rules / Settings toolbar is absent, making several completed features effectively undiscoverable.

V15 restores V13 as the color source of truth and keeps the newer lobby structure and functionality. The game engine and game UI modules remain byte-for-byte identical to V13.

## Requirements audit

| Area | V15 status |
|---|---|
| V13 color palette | Restored |
| Blue team | V13 `#28679b` + `#cadcec` |
| Red team | V13 `#a8302f` + `#ecd0cc` |
| Page background | V13 `#f5f0e7` |
| Main surfaces | V13 `#fffdf8` / `#efe8dc` |
| Main action color | V13-style `#303a2d` |
| Admin top control | Present and forced visible while in room |
| News | Present |
| Rules | Present and expanded |
| Settings | Present and accessible |
| Settings: Admin | Players, Lock Teams, Reset, Randomize, card language, strict/expert, invite |
| Settings: Player | Avatar, Nickname, five role choices, Leave Match |
| Settings: Preferences | UI language, Dark mode, sound, guess button, room URL, show hints |
| Settings: Accessibility | Text size, colorblind symbols, seasonal themes, Reduced Motion |
| Quick Guide | Present with Got It, Rules, Auto-show |
| Spectators | Avatar + nickname + host crown |
| Join Team | Present for both operative/spymaster slots |
| Start validation | Requires connected valid active players |

## Root cause: missing Settings/navigation
In V14, the top toolbar was created with the HTML `hidden` attribute and was unhidden by `lobby-v14.js` after receiving `codenames-online-state`. The underlying realtime module controlled the lobby visibility separately. If those state paths became temporarily unsynchronized, the lobby could be visible while the toolbar stayed hidden. That makes Settings, Rules and News look missing even though their dialogs exist in the document.

V15 fixes this by making the realtime shell itself set both the room/lobby body classes and the toolbar visibility. The lobby UI still mirrors the same state, so there are now two consistent paths rather than a single fragile dependency.

## V13 color comparison
V13 defines the core palette as:
- Background `#f5f0e7`
- Surface `#fffdf8`
- Secondary surface `#efe8dc`
- Ink `#1e1d1a`
- Border `#d9d1c3`
- Red `#a8302f`
- Red soft `#ecd0cc`
- Blue `#28679b`
- Blue soft `#cadcec`

V15 uses those exact variables for the lobby, team panels and modal system. The earlier V14 neon values remain only in the historical CSS block and are overridden by the V15 layer.

## Realtime issues found during audit

### 1. Late action execution after Host timeout
V14 action requests time out locally after 15 seconds, but the action itself remained in Firebase. If the Host returned later, it could process an action the requesting player had already been told had failed. This could result in a delayed guess or other stale action.

V15 writes `expiresAt` on each action. The authoritative Host processor rejects and removes expired actions before applying them to game state.

### 2. Disconnected lobby players counted as active
V14 lobby validation and Start Game used player records regardless of `online:false`. A disconnected record could therefore make a team look valid or remain part of a future lobby.

V15 counts only connected players for Start Game and automatic team distribution. When a match returns to the lobby, stale offline non-host records are removed and team locking is cleared.

## Regression verification
- JavaScript syntax: pass for every file in `js/`.
- Firebase rules JSON parse: pass.
- Duplicate HTML IDs: none (170 IDs checked).
- Lobby cached DOM references: all present (56/56).
- Required feature IDs: all present.
- Local script references: all files exist.
- Automated game/UI suite: **38/38 passed**.
- `game.js`: SHA-256 matches V13 exactly.
- `ui.js`: SHA-256 matches V13 exactly.

## Browser-rendering limitation of this audit
The available sandbox Chromium process hangs because of the container's browser/DBus restrictions, so a trustworthy pixel screenshot could not be produced in this environment. The visual correction was therefore verified structurally from the CSS cascade and the exact V13 palette, while functional regression checks were executed independently. A final visual pass on the deployed Firebase-hosted build is still appropriate for device-specific spacing and browser chrome.

## Deployment requirement
V15 changes `online.js` behavior but does not require a new Firebase schema beyond the V14 rule set. Still deploy the `firebase-rules.json` included with V15 to ensure the current self-assignment and room permissions are in sync with the client.
