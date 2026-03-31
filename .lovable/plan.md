
## Plan

### 1. Pressão Final Verification
The system logic is correctly implemented in `Match.tsx` (lines 703-778):
- At minute 83, a 20% roll decides if it triggers
- A random minute between 83-88 is picked for activation
- 2 minutes after activation, a mandatory event fires with score-biased probabilities
- Visual overlay deactivates after 3 seconds
- The `PressaoFinal` component renders the red pulsing vignette

No code changes needed here — the system is wired correctly.

### 2. "Formações" Button: Black Background + Full-Screen Modal

**Current**: The "Formações" button is white with black text, opens a small dropdown that overlaps the reserves section (cramped).

**Change**: 
- Style the "Formações" button with **black background, white text** (matching dark theme)
- Replace the dropdown with a **full-screen modal/overlay** (fixed, black background) that opens when clicked
- The modal contains:
  - Header with title "Formações Salvas" and an X close button
  - "Salvar formação atual" button with name input
  - List of saved formations with load/delete actions
  - Much more breathing room than the current tiny dropdown

**File**: `src/components/TacticsManager.tsx`
- Change button class from `bg-white text-black` to `bg-black text-white border border-zinc-700`
- Replace the `openDropdown === "saved"` dropdown div with a full-screen fixed overlay (`fixed inset-0 z-50 bg-black`)
- Keep all existing save/load/delete logic intact, just move the UI into the modal layout
