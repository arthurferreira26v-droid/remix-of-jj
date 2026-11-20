# Project conventions
- Register playable leagues and clubs in `src/data/teams.ts`; selection, schedules and market membership derive from this shared registry to avoid inconsistent club lists.
- Keep horizontal league scrolling confined to `LeagueSelector`; squad access remains through the floating menu.
- Campaign overlays reuse one History API guard with a ref-backed back-button listener; never push history on overlay state changes, to prevent stale entries and accidental campaign navigation.
- Resolve asset pointers through `assetUrl` when needed locally; the sandbox uses the hosted asset gateway while deployed apps retain same-origin asset URLs.
- Campaign home owns persistent roster and tactics; Match uses local lineup/order and controlled nonpersistent tactics, merging only durable outcomes by player ID after completion to prevent substitutions from overwriting home selections.
- Coach offers are stored per championship ID; accepting moves local fixture/standing ownership within the same league and remounts the campaign by team, retaining the destination's live roster instead of remerging admin defaults.