# V16 Invite-Link and Mid-Game Join Audit

## Executive finding

The invitation failure was real and had two separate layers. In V15, the client displayed one generic error for several different Firebase failures, so `Room code is wrong, room is closed, or the game already started.` did not identify the actual condition. More importantly, the V15 Realtime Database rules explicitly allowed a brand-new player record to be created only while the room status was `lobby`. That made a fresh visitor categorically unable to enter once the room changed to `playing`.

The supplied invite reference requires a different model: the invitation URL already identifies the room, so the visitor should not type a room code. The visitor sees a blocking `Welcome to Codenames` nickname gate, enters a nickname, presses `ENTER GAME`, and only then becomes a room participant. The supplied reference also requires the room to remain visible but blurred/darkened behind the gate. The official Codenames room pages currently expose the same four pieces of entry UI: `Welcome to Codenames`, `To enter the room, choose a nickname.`, a `Nickname` input, and an `Enter Game` button.^1

V16 implements that flow and changes the membership rules so a new authenticated visitor may join as a Spectator while the room is either `lobby` or `playing`. A visitor who enters an already-running match can then choose a team/role from `Settings → Player`. The V13 game engine and main game UI remain byte-for-byte unchanged.

## What the official online product supports

Codenames' official online page describes the browser game as a room-and-link workflow: create a virtual room, share the URL, and let friends join without creating accounts or installing anything.^2 The official shared-room pages indexed by the web currently show the exact nickname gate requested for this project.^1 This supports treating the invitation URL as the room locator and the nickname form as the participant-entry step, rather than sending an invitee back to the generic Create/Join home screen.

The official online product is effectively a virtual table rather than an account-centric matchmaking system. CGE describes Codenames Online as a browser-based way to gather with friends remotely, with play behavior intentionally close to the physical game.^3 That architecture is consistent with allowing room membership to be independent from the moment the round was started.

## Root-cause analysis of V15

### 1. V15 blocked first-time joins after `Start Game`

The V15 `firebase-rules.json` required a brand-new `/rooms/<code>/players/<uid>` write to satisfy:

```text
room status === "lobby"
team === "spectator"
role === "spectator"
isHost === false
```

Once the Host started the game, the room status became `playing`. A new visitor therefore could not create their own player record. This was not a visual problem; it was a server-enforced permission failure.

Firebase documents that Realtime Database Security Rules determine whether each read/write is permitted and are enforced on the server.^4 That means changing only the front-end button or removing the JavaScript error would never fix this condition; the published rules also had to change.

### 2. V15 also disabled team/role changes outside the Lobby

`setSelfAssignment()` returned `NOT_IN_LOBBY` unless `runtime.roomStatus === 'lobby'`, and the Player settings role buttons were disabled whenever the room was not in the Lobby. Even if a player record somehow existed during a running game, the UI and client API still prevented the requested post-entry team selection.

### 3. The error message hid the real failure class

V15 used the same fallback for a permission failure, missing room, stale rules, and a started game:

```text
Room code is wrong, room is closed, or the game already started.
```

That message was too broad to diagnose the deployment. A Lobby join should have been legal under the V15 source rules, so if a friend was failing before the Host started, the strongest deployment-level explanations are that the live Firebase rules were not the same rules bundled with the site, or Anonymous Authentication was not available for that visitor. Firebase's anonymous-auth documentation confirms that `signInAnonymously()` is the intended mechanism for temporary authenticated users who need access to rules-protected data.^5

V16 removes the misleading “game already started” fallback because a started game is now an accepted join state.

## V16 invitation experience

Opening a URL containing `?room=XXXXXX` now activates a dedicated entry gate instead of repurposing the generic Join Room card. The gate uses the exact required text:

```text
Welcome to Codenames

To enter the room, choose a nickname.

[ Nickname ]

[ ENTER GAME ]
```

There is no close button. Pressing Enter in the input submits the same form as clicking `ENTER GAME`. The room code remains internal because it already came from the URL.

The room shell is displayed behind the gate, with a strong blur and darkened treatment modeled from the supplied screenshot. It is non-interactive until membership succeeds. Importantly, this preview is only the local room/lobby shell; V16 does not weaken database read permissions to download secret game data before the visitor becomes a room member. A CSS blur is presentation, not security.

The user-supplied reference specifies the same conceptual separation: the URL resolves the room, while the nickname establishes who the visitor is inside that room.^6

## Joining before and after the game starts

### Lobby join

A fresh authenticated UID may create only its own player record, and the new record must begin as:

```text
team = spectator
role = spectator
isHost = false
```

After that write succeeds, normal room listeners are attached and the player appears in Spectators.

### Active-match join

V16 extends exactly the same safe creation path to `status === 'playing'`. The visitor still enters as a Spectator and receives only public game state. The Player settings tab is automatically opened for a visitor who joined via an invite while a game is already running, making team selection immediately discoverable.

During `playing`, self team/role assignment is permitted even though the Start Game transition sets `teamsLocked = true`. `teamsLocked` continues to behave as a pre-game Lobby control; it no longer accidentally prevents a late entrant from choosing a role after the round is underway.

The client retains the existing single-Spymaster occupancy check. A player can choose Red Operative, Blue Operative, Spectator, or an available Red/Blue Spymaster slot.

## Realtime roster consistency

Allowing late joins creates an additional state-consistency requirement: the public round snapshot was originally generated from the player list that existed at Start Game. If nothing else changed, a late entrant could be authorized by the live Firebase player table but remain missing from the visible in-game roster.

V16 therefore injects the current live room player list into the local game snapshot whenever room-player data changes. The Host's authoritative action processor also applies the live player list before processing game actions. This keeps authorization and visible roster state aligned without changing the actual card board, clue state, remaining counters, or secret-role map.

Explicit `Leave Match` now removes the player's membership record during either Lobby or active play. Accidental network loss still uses the existing presence system and marks the user offline, preserving reconnect behavior.

## Firebase security model after the change

V16 does not make the room public. A visitor still has to authenticate anonymously first, and the visitor may create or modify only their own player path. Firebase documents owner-path rules using `auth.uid` as the standard pattern for limiting a user to their own data.^4

The V16 rules keep these boundaries:

| Data / action | Visitor before membership | Room member | Host | Spymaster |
|---|---:|---:|---:|---:|
| Create own Spectator record | Yes, Lobby/Playing | n/a | n/a | n/a |
| Read player list | No | Yes | Yes | Yes |
| Change own team/role in Lobby | If teams unlocked | Yes | Yes | Yes |
| Change own team/role while Playing | After join | Yes | Yes | Yes |
| Write public game state directly | No | No | Host-authoritative flow | No |
| Read unrevealed secret role map | No | No | Yes | Yes |
| Modify another player's membership | No | No | Yes through Host controls | No |

Realtime Database `.validate` rules remain important because Firebase evaluates validation after write authorization and rejects the entire write if required validation fails.^7 V16 preserves validation of the UID, immutable Host flag/join timestamp on existing records, allowed team values, allowed role values, nickname length, and avatar range.

## Why the current Lobby failure can persist until deployment is updated

The source fix alone is not sufficient. Firebase rules are server-side. If the website is uploaded as V16 but the Firebase Console is still serving V15/V14 rules, a new invitee can still receive `permission_denied`, especially during `playing`.^4

For that reason, V16 includes a deployment note that makes the rule update mandatory:

```text
Firebase Console
→ Realtime Database
→ Rules
→ replace all rules with V16 firebase-rules.json
→ Publish
```

Anonymous Authentication must also remain enabled.^5

## Verification performed

The V16 package passed structural and static regression checks:

- Every JavaScript file in `js/` and `tests/` passes `node --check`.
- The existing zero-dependency Game/UI regression suite passes **38/38** tests under a JavaScript test harness; the tested core files are unchanged from V13.
- `firebase-rules.json` parses as valid JSON.
- `index.html` contains 175 IDs with no duplicates.
- Every local script/stylesheet reference resolves to a real file.
- The exact required invitation strings are present.
- The obsolete “game already started” join error is removed.
- Online self-assignment explicitly recognizes both `lobby` and `playing`.
- Player Settings role buttons explicitly recognize both `lobby` and `playing`.
- The Firebase player-create and team/role rules include the `playing` state.
- The active-game snapshot uses live room players.
- The mid-game invite flow triggers Player settings after joining.
- `game.js` SHA-256 matches V13 exactly.
- `ui.js` SHA-256 matches V13 exactly.

A reliable pixel screenshot could not be produced inside the container because headless Chromium hangs on the environment's browser/DBus process. The invite layout was therefore verified structurally against the supplied dimensions and DOM/CSS, not claimed as a browser-level pixel-diff pass. The final device/browser visual pass should be done on the deployed site.

## Acceptance test after deployment

1. Publish every V16 site file.
2. Publish the V16 `firebase-rules.json` in Realtime Database Rules.
3. Confirm Anonymous Authentication is enabled.
4. Host creates a new room.
5. Open the Invite Link in a private/incognito browser with a different Firebase anonymous session.
6. Confirm the screen shows `Welcome to Codenames`, the nickname instruction, `Nickname`, and `ENTER GAME`.
7. Enter a nickname; confirm the player appears as Spectator.
8. Assign four valid players and start the match.
9. Open the same Invite Link in a third clean/private session.
10. Confirm entry still succeeds while the room status is `playing`.
11. Confirm `Settings → Player` opens and allows the new participant to choose Red/Blue Operative or an available Spymaster slot.
12. Confirm the new participant appears in the in-game roster and can only perform actions authorized for the selected team/role.
13. Confirm a Spectator or Operative cannot read the secret key; a Spymaster can.

## Sources

1. Czech Games Edition, “Codenames Online” shared-room pages, including [kizup-mivop](https://codenames.game/r/kizup-mivop) and [fabif-vopaf](https://codenames.game/r/fabif-vopaf), accessed September 2026. The indexed pages expose the current `Welcome to Codenames` nickname gate.
2. Czech Games Edition, “[Play Codenames Online – Free Browser Game](https://www.codenamesgame.com/play-online),” accessed September 2026. Describes creating a room, sharing the room URL, browser play, and no accounts/downloads.
3. Czech Games Edition, “[Codenames App vs Codenames Online: What’s the Difference?](https://www.codenamesgame.com/news/codenames-app-vs-codenames-online-whats-the-difference),” July 22, 2025.
4. Google Firebase, “[Understand Firebase Realtime Database Security Rules](https://firebase.google.com/docs/database/security),” accessed September 2026.
5. Google Firebase, “[Authenticate with Firebase Anonymously Using JavaScript](https://firebase.google.com/docs/auth/web/anonymous-auth),” accessed September 2026.
6. `Pasted markdown.md`, user-supplied invite-screen specification and coordinate analysis, supplied in this project conversation.
7. Google Firebase, “[Data validation — Firebase Security Rules](https://firebase.google.com/docs/rules/data-validation),” accessed September 2026.
