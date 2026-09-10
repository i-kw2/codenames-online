# V6 – Candidate selection hotfix

- Fixed the online **Cards under consideration / البطاقات المحتملة** crash that could surface as `HOST_PROCESSING_ERROR`.
- Root cause: Firebase Realtime Database may omit an empty `cardIds: []` after synchronization; the host then attempted `indexOf()` on a missing value.
- Candidate-selection state is now normalized on every synchronized state replacement and before every candidate action.
- Supports Firebase list/object shapes safely and de-duplicates candidate IDs.
- Confirming a selected candidate continues to use the existing authoritative guess flow and double-submit protection.
- Added regression tests for missing `cardIds` and Firebase object-shaped candidate lists.
