# Codenames V17 — Invite Join / Firebase Audit

## Finding

The visible Welcome gate was not the root problem. The failure happened after the visitor pressed **ENTER GAME**, when the browser tried to create the visitor's player record in Firebase Realtime Database.

V16 used one player schema for new visitors:

- `team: spectator`
- `role: spectator`
- `avatarId: 1..25`

Older V13 server rules instead accepted new visitors in the Lobby only when the record was created as:

- `team: unassigned`
- `role: operative`

Firebase Realtime Database Security Rules are enforced on Firebase's servers, not by the HTML/JavaScript bundle. Therefore a static-site update cannot make a write legal if an older ruleset is still deployed.

## V17 fix

V17 makes the join path migration-safe:

1. Sign in anonymously.
2. Use the room code from the invite URL.
3. If available, read the non-secret `entry` metadata for room/rules diagnostics.
4. Try the modern V17 visitor record (`spectator / spectator`).
5. If Firebase returns `permission_denied`, retry the exact V13-compatible Lobby record (`unassigned / operative`).
6. Render legacy `unassigned` visitors as Spectators in the V17 Lobby UI.
7. If old V13 rules also block direct team/role edits, send an `assignSelf` action; the V17 Host processes that action and performs the assignment using Host authority.
8. If both schemas are denied, show a targeted Firebase setup message instead of incorrectly saying only that the room is missing.

This fallback fixes Lobby invitations when an older V13-compatible database ruleset is still deployed.

## Mid-game joining

Joining a match already marked `playing` still requires the V17 Realtime Database rules to be published. V13 rules explicitly allow creation of new player records only while the room status is `lobby`; browser JavaScript cannot override that server rule.

New V17 rooms contain:

```text
entry/
  rulesVersion: 17
  status: lobby | playing
  roomName: ...
```

The `entry` node contains no secret role information and is readable only by authenticated Firebase users. It lets V17 distinguish an open room from a rules/configuration problem.

## Firebase configuration checks

The Firebase documentation requires Anonymous Authentication to be enabled before `signInAnonymously()` can be used. Realtime Database Security Rules are evaluated on the Firebase servers for every database read/write. If App Check enforcement is enabled for Realtime Database, requests without a valid App Check attestation are rejected even if Authentication and Database Rules would otherwise allow them.

Accordingly, production deployment must verify all three layers:

1. **Firebase Authentication** — Anonymous provider enabled.
2. **Realtime Database Rules** — publish this V17 `firebase-rules.json`.
3. **App Check** — if Realtime Database enforcement is ON, configure a Web App Check provider in the site; otherwise turn enforcement OFF while testing.

## Code-level verification

- All JavaScript files pass `node --check`.
- `firebase-rules.json` parses as valid JSON.
- Existing zero-dependency Game/UI suite: **38/38 passed** in a Node VM harness.
- V17 cache-busts static resources with `?v=17.0`, preventing the browser from silently continuing to run V16 `online.js` after deployment.
- `game.js` and `ui.js` were not changed by the invite fix.
- Secret map access remains restricted by Realtime Database rules to the Host and Spymasters.
- Invite background remains blocked/blurred until the nickname join completes.

## Remaining deployment dependency

No client-only package can force Firebase to accept a write rejected by server-side Security Rules or by enforced App Check. If a V17 visitor receives the new targeted permission message after the V17 rules are published, App Check should be checked next.

## Sources

1. Firebase, **Authenticate with Firebase Anonymously Using JavaScript** — https://firebase.google.com/docs/auth/web/anonymous-auth
2. Firebase, **Understand Firebase Realtime Database Security Rules** — https://firebase.google.com/docs/database/security
3. Firebase, **Core syntax of Realtime Database Security Rules** — https://firebase.google.com/docs/database/security/core-syntax
4. Firebase, **Firebase App Check** — https://firebase.google.com/docs/app-check
5. Firebase, **Enable App Check enforcement** — https://firebase.google.com/docs/app-check/enable-enforcement
