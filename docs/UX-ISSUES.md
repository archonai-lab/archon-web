# UX Issues — For Sable

> From live testing on 2026-03-23. Human participation works but needs polish.

## Critical UX

### Button press delay
When pressing Speak/Pass buttons, there's noticeable lag before the UI responds. The relevance prompt stays visible too long after clicking. Needs:
- Immediate visual feedback on click (button state change, loading indicator)
- Optimistic UI — hide the prompt immediately, don't wait for hub confirmation
- Consider disabling buttons after click to prevent double-send

### Stale meeting accumulation
Failed/cancelled meetings pile up in the sidebar. 41 stale meetings accumulated during testing. Needs:
- Auto-hide cancelled meetings or move to a "past" section
- Hub should clean up stale active meetings on restart

## Polish

### Relevance prompt
- The prompt appears between messages and the input — it can feel jarring
- Consider a slide-in animation or a softer visual treatment
- Auto-pass timeout with visible countdown (e.g., 30s timer bar) so meetings don't stall if human walks away
- Show who is waiting (e.g., "Kalyx is waiting for your response")

### Turn indicator
- "Your turn to speak" banner works but doesn't auto-focus the input field
- Should pulse or draw attention more — easy to miss in a busy chat
- Consider a sound notification (optional, toggleable)

### Phase approval
- Works but feels disconnected from the meeting flow
- Could be inline with the phase indicator bar instead of a separate banner

### Message input
- No visual difference between "speaking during your turn" vs "speaking out of turn"
- Could highlight the input differently when it's your turn (amber border?)
- Enter-to-send should feel instant — any lag breaks flow

### General
- Agent avatars use 2-letter codes (CE, TE) — human should show differently (photo placeholder? different shape?)
- "levia thinking..." shows when hub is waiting for human response — should say "waiting for your response" instead
- Dark theme colors work but the participation elements (blue/amber/purple bars) could be more cohesive
- Mobile responsiveness for participation buttons not tested

## Architecture notes for implementation
- All participation state is in `MeetingState` (relevanceCheck, isMyTurn, awaitingApproval)
- Callbacks wired through `onRelevance` and `onApprove` props in MeetingRoom
- State clears automatically after action (speak clears isMyTurn, etc.)
- No optimistic updates currently — all state changes come from hub messages
