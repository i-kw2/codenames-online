# V5

- Invite links now show a name-first Join screen before entering the room.
- Fixed online candidate selection/confirmation race by processing each Firebase action once with child-added queueing and atomic claims.
- Added recovery for transient candidate-sync loss during confirm.
- Spymasters continue to receive candidate selections through the public synchronized game state.
- End Turn is now allowed during guessing even when no card has been guessed.
- Added regression tests for zero-guess end turn, candidate confirm, and candidate visibility.
