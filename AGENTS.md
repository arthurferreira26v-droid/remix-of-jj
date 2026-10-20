# Project conventions
- Register playable leagues and clubs in `src/data/teams.ts`; selection, schedules and market membership derive from this shared registry to avoid inconsistent club lists.
- Keep horizontal league scrolling confined to `LeagueSelector`; squad access remains through the floating menu.
- Resolve asset pointers through `assetUrl` when needed locally; the sandbox uses the hosted asset gateway while deployed apps retain same-origin asset URLs.