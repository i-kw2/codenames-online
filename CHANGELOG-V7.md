# V7 – Direct card guessing

- Removed the **Cards under consideration / البطاقات المحتملة** workflow from the UI and game state.
- Operatives now click an unrevealed card to submit the final guess immediately.
- Online games use the existing authoritative `guess` action directly; candidate toggle/clear/commit actions were removed.
- Added client-side busy protection while an online guess is processing to prevent double submission.
- Legacy V6 `candidateSelection` data is discarded safely when an older synchronized snapshot is loaded.
- Kept voluntary End Turn available during the guessing phase, including when zero cards have been guessed.
- Updated regression tests for direct guessing and legacy-state cleanup.
