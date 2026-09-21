# Codenames Bilingual V18 — Implementation and Verification Audit

## Scope

V18 is intentionally a narrow upgrade over the already-working V17 build. It implements four requested game-screen features without redesigning the invitation/Firebase/lobby path that was confirmed stable:

1. Opening word-card deal animation.
2. Separate in-game presentation for Operatives and Spymasters.
3. A synchronized clue announcement visible to everyone in the running room.
4. A shared Game Log visible to everyone in the running room.

The supplied design notes were treated as the implementation specification. The opening deal follows the described physical-card fan from one bottom-center origin; the game screen follows the supplied left-team / center-board / right-team composition; the clue composer uses a word plus a 0–9/∞ picker; and the Game Log is a read-only chronological event feed rather than a player chat.

## 1. Opening card deal

### Required behavior

The board must not simply fade in. The 25 cards should appear as if dealt from a single hidden deck at the middle of the lower screen. Cards launch sequentially in row-major order: R1C1 through R1C5, then R2C1, continuing through R5C5. Each next card begins before the previous card finishes, producing the diagonal/fan snapshot described in the reference.

### V18 implementation

`js/effects.js` adds `dealBoardCards()` and `requestInitialDeal()`.

The final card positions remain owned by CSS Grid. Each card's final screen center is read with `getBoundingClientRect()`, and the animation begins at a common origin:

- Origin X: `window.innerWidth / 2`
- Origin Y: `window.innerHeight + 44`
- Card flight: `560 ms`
- Stagger: `72 ms`
- Easing: `cubic-bezier(.16,1,.3,1)`
- Initial scale: `.97`
- Settle: `-4 px` before returning to the exact grid slot

This uses transforms rather than repeatedly changing `top`/`left`, so the final 5×5 responsive grid remains the source of truth.

During the sequence the board is `inert` and `aria-busy=true`; interaction is restored only after card 25 settles. The deal is keyed by `roundId` so a normal re-render does not replay it. A player who joins a round that has already progressed receives the current board immediately rather than replaying an obsolete opening animation.

Reduced Motion is respected both through `prefers-reduced-motion` and the project's manual `disable-gameplay-animations` accessibility class.

## 2. Operative and Spymaster game screen

### Shared layout

`index.html` now contains a dedicated V18 game composition rather than relying on the old generic gameplay panel. On desktop:

- Blue team rail stays physically on the left.
- The 5×5 board stays in the center.
- Red team rail stays physically on the right.
- Game Log occupies the lower section of the right rail.

This physical team placement does not reverse when the website language is Arabic; text direction can still be RTL while the game composition remains Blue-left / Red-right.

### Team rails

Each team has separate Operatives and Spymasters panels. Live room players are injected into the synchronized game snapshot by `js/online.js`, including `avatarId`, `isHost`, and `online`, so the game screen can show the actual room members without changing the authoritative game rules.

The role that currently owns the action receives `active-turn` styling:

- Clue phase → current team's Spymaster panel.
- Guessing phase → current team's Operatives panel.

Remaining agent counts are shown prominently beside each team.

### Spymaster view

The existing V17 security model is preserved. In Online mode, a device automatically enters Spymaster view only when the current player is a Spymaster and the authorized secret map has been received. Unrevealed role colors are therefore rendered only for authorized Spymasters/Host processing, not ordinary Operatives/Spectators.

The clue composer contains:

- `YOUR CLUE` text input.
- Circular number selector.
- Number menu: `0 1 2 3 4 5 6 7 8 9 ∞`.
- Green confirmation action.

`0` and `∞` remain unavailable unless Expert Rules are enabled, preserving the pre-existing game rule behavior.

### Operative view

Unrevealed cards remain neutral because the public snapshot continues stripping secret `card.role` data. Revealed cards retain their established reveal artwork and role frame behavior.

During guessing, the bottom bar is read-only and shows:

- Current clue word.
- Current clue count.
- Guess counter.
- Green End Guessing action when the game rules permit voluntary ending.

The board remains disabled for users who are not an Operative on the current team. This preserves V17 host-side online action authorization in addition to UI disabling.

## 3. Synchronized clue announcement

### Event source

No new Firebase data channel was created. The existing `CLUE_SUBMITTED` game log event is part of `publicGame`, which is already broadcast to every room member. This keeps the feature synchronized with the authoritative host game engine.

### Presentation

`js/effects.js` listens for a new `CLUE_SUBMITTED` log entry and immediately locks the board. It then queues a centered overlay containing:

- Clue word.
- Number, `0`, or `∞`.
- Team-aware border styling.

Normal timing is approximately three seconds total:

- quick appearance,
- readable hold,
- short fade/scale exit.

Reduced Motion retains the three-second information display but removes the motion-heavy transition.

After the overlay disappears, the clue is not deleted. It remains in synchronized game state, the Operative clue bar, and the Game Log until the turn changes.

A late joiner does not replay historical clue announcements from earlier turns; `consumeLogs()` marks old room history as already seen on initial attachment to an established round.

## 4. Shared Game Log

### Data source

The Game Log is rendered from `state.logs`, which is included in the public synchronized snapshot. It is therefore visible to every client that is inside the running game, without exposing the secret role map.

To identify actors accurately, V18 adds optional metadata to existing log payloads:

- `CLUE_SUBMITTED`: `actorId`, `actorName`
- `CARD_REVEALED` when caused by a guess: `actorId`, `actorName`
- `TURN_ENDED`: `actorId`, `actorName`

`js/online.js` supplies these values from the authenticated room action that the Host is processing. This does not grant the guest new authority; it only records who performed an already-authorized action.

### Rendering

`renderGameLog()` groups events chronologically by clue/turn. Each turn block contains:

- Team-colored clue header.
- Spymaster avatar/name.
- Clue word.
- Clue count.
- Operative guess rows under that clue.
- Operative avatar/name.
- Guessed word.
- Compact outcome marker.

The panel is collapsible. Its event region scrolls internally rather than growing over the board. When the viewer is already near the bottom, new events auto-scroll into view; if the viewer has scrolled up to inspect old history, rendering does not intentionally force them away from that history.

The Game Log is read-only system history. It is not a chat input.

## Multiplayer/security compatibility

The critical V17 online behavior was deliberately preserved:

- `firebase-rules.json` is byte-for-byte identical to V17.
- `js/firebase-config.js` is byte-for-byte identical to V17.
- Invite entry, anonymous authentication, mid-game join support, V13 lobby fallback, room preview, and team assignment fallback remain in `js/online.js`.
- The only Online changes for V18 are live display metadata (`avatarId`, `isHost`, `online`) and actor metadata supplied to already-authorized game actions.
- Secret roles are still excluded from the public snapshot for unrevealed cards.

No V18 feature requires publishing a different Firebase Rules schema if the working V17 rules are already deployed.

## Game-engine compatibility

V18 does not alter scoring, win conditions, turn rules, clue validation, role distribution, or reveal rules. The `game.js` changes are additive and backward-compatible:

- `handleGuess(cardId, actor)` still works when called with only `cardId`.
- `revealCard(..., actor)` still works without the optional actor.
- `submitClue(input)` accepts the same clue object; optional actor fields are logged when present.
- `endTurn(reason, options)` already accepted options; V18 logs optional actor fields.

The actor metadata is used to make the shared Game Log identify the correct Spymaster/Operative.

## Verification performed

### Automated rule/UI tests

The existing zero-dependency test set was retained and three V18 tests were added:

- clue log preserves submitting Spymaster id/name;
- guess log preserves acting Operative id/name;
- public snapshot publishes Game Log history while still hiding unrevealed secret roles.

Result: **41/41 tests pass**.

### Static/runtime-safety checks

- `node --check` passes for `game.js`, `ui.js`, `effects.js`, `online.js`, and `lobby-v18.js`.
- `firebase-rules.json` parses successfully as JSON.
- CSS brace counts are balanced.
- `tinycss2` reports zero top-level stylesheet parse errors.
- `index.html` local script/style/image references resolve.
- CSS `url(...)` local asset references resolve.
- HTML IDs are unique and the V18 UI retains compatibility IDs expected by the older game/UI hooks.

### Browser-render limitation of this build environment

An automated Chromium screenshot/pixel comparison was attempted during development, but this environment blocks the local/file page navigation path used for that test. Therefore this audit does **not** claim a successful automated pixel-perfect browser screenshot comparison. The implementation was instead checked through source-level layout validation, syntax/static checks, game-engine tests, and integration-state review.

## Deployment acceptance checklist

Use two devices or two independent browser sessions against the deployed Firebase project:

1. Create a room and join from the invite link as in V17.
2. Assign two valid teams and start the match.
3. Confirm both clients see the 25 cards deal from the lower center into the 5×5 board.
4. Confirm only the authorized Spymaster sees secret colors and clue input.
5. Submit a clue and confirm every connected game client sees the centered clue announcement.
6. After the announcement, confirm the current Operative can guess and other roles cannot.
7. Confirm the clue remains in the lower clue bar after the center announcement disappears.
8. Confirm the Game Log adds the clue with the correct Spymaster identity.
9. Guess a card and confirm all clients append the same Operative/word/outcome row.
10. End/switch turns and confirm history remains chronological rather than being replaced.
11. Join the running game from a new invite session and confirm the historical deal/clue animations are not replayed as if they were new events.
12. Enable Reduced Motion and confirm gameplay remains functional without the large card movement.

## Conclusion

V18 implements the requested four game-screen features on top of V17 rather than replacing the stable online system. The new animations and displays are presentation layers driven by the existing synchronized game state, while the small actor-metadata additions make the shared Game Log accurate across devices. The Firebase rule/configuration files remain unchanged from V17, and the existing classic game-rule tests continue to pass together with the new V18 logging tests.
