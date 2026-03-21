# Protocol Gap Analysis: archon-web ↔ archon hub

> Generated via archon-lens cross-project analysis, 2026-03-21
> Hub version: archon@0791e52 (main)
> Client version: archon-web@9afe5e1 (main)

## Summary

The client works as a **passive observer** — it can create meetings, see messages, and read transcripts. But it **cannot participate in the discussion flow** (relevance → turn → speak cycle). This blocks the core goal: letting humans observe AND join meetings alongside agents.

---

## Critical: Human Participation (blocks primary goal)

These 3 inbound messages are sent by the hub during meetings but the client ignores them entirely:

### 1. `meeting.relevance_check` — NOT HANDLED

**Hub sends:** "Do you want to speak about the last message?"
**Expected response:** `meeting.relevance` with level `must_speak | could_add | pass`
**Client today:** Silently ignored — human is never asked if they want to speak
**Impact:** Human is invisible during the relevance round. The hub thinks they passed.

**UI needed:** A prompt/notification when relevance is checked: "Agent X just said Y — do you want to respond?" with three buttons (Must Speak / Could Add / Pass). Auto-pass after a timeout (e.g., 15s) so the meeting doesn't stall waiting for a human.

### 2. `meeting.your_turn` — NOT HANDLED

**Hub sends:** "It's your turn to speak."
**Expected response:** `meeting.speak` with content
**Client today:** Silently ignored — human never gets to speak even if they wanted to
**Impact:** The turn is wasted. The hub may time out and move to the next agent.

**UI needed:** Highlight the message input, show "Your turn to speak" banner, focus the text field. The human types their message and sends it as `meeting.speak`.

### 3. `meeting.awaiting_approval` — NOT HANDLED

**Hub sends:** "Phase X is complete, approve transition to phase Y?"
**Expected response:** `meeting.advance` (approve) or nothing (block)
**Client today:** Silently ignored — phases can't be approved from the web client
**Impact:** Meetings with `approvalRequired: true` will hang forever waiting for approval.

**UI needed:** Modal or banner: "Phase DISCUSS complete → advance to DECIDE?" with Approve/Hold buttons.

---

## Missing: Client → Hub Messages

### 4. `meeting.relevance` — NOT SENT

Client has no method to send relevance responses. Needed to answer `meeting.relevance_check`.

**Add to `ws.ts`:**
```typescript
sendRelevance(meetingId: string, level: "must_speak" | "could_add" | "pass"): void {
  this.send({ type: "meeting.relevance", meetingId, level });
}
```

### 5. `meeting.approve` — NOT SENT

Client has no method to approve phase transitions. Needed to answer `meeting.awaiting_approval`.

**Add to `ws.ts`:**
```typescript
approveMeeting(meetingId: string): void {
  this.send({ type: "meeting.approve", meetingId });
}
```

### 6. `meeting.leave` — NOT SENT

Client can cancel meetings but can't gracefully leave one (e.g., stop participating but keep watching).

**Add to `ws.ts`:**
```typescript
leaveMeeting(meetingId: string): void {
  this.send({ type: "meeting.leave", meetingId });
}
```

---

## Minor: Missing Features

### 7. `agent.enrich` — NOT SENT

Hub supports enriching agent metadata (adding skills, capabilities). Client doesn't expose this.

**Priority:** Low — not needed for MVP human participation.

### 8. `agent.status` — NOT SENT

Hub supports querying individual agent status. Client only uses `directory.list`.

**Priority:** Low — `directory.list` covers most use cases.

### 9. `directory.get` — NOT SENT

Hub supports fetching a single agent's details. Client fetches the full directory instead.

**Priority:** Low — optimization, not a feature gap.

---

## Implementation Plan

### Phase 1: Wire the protocol (ws.ts)

Add 3 methods + 3 message handlers:

```
ws.ts changes:
  + sendRelevance(meetingId, level)
  + approveMeeting(meetingId)
  + leaveMeeting(meetingId)

  handleMessage additions:
  + case "meeting.relevance_check" → emit to listeners
  + case "meeting.your_turn" → emit to listeners
  + case "meeting.awaiting_approval" → emit to listeners
```

Track participation state in `MeetingState`:
```typescript
interface MeetingState {
  // ... existing fields ...
  relevanceCheck?: { lastMessage: { agentId: string; content: string }; phase: string };
  isMyTurn?: boolean;
  awaitingApproval?: { currentPhase: string; nextPhase: string };
}
```

### Phase 2: UI components

**RelevancePrompt** — appears when `meeting.relevance_check` received:
- Shows last message context
- Three buttons: Must Speak / Could Add / Pass
- Auto-pass timeout (15s countdown)
- Sends `meeting.relevance` on click

**TurnIndicator** — appears when `meeting.your_turn` received:
- "Your turn to speak" banner above message input
- Message input auto-focused
- Typing sends `meeting.speak`
- Timeout warning if no response

**PhaseApproval** — appears when `meeting.awaiting_approval` received:
- "Phase DISCUSS complete → DECIDE?" modal
- Approve / Hold buttons
- Sends `meeting.advance` on approve

### Phase 3: App.tsx integration

Wire new message types in the `useHub()` switch:
```typescript
case "meeting.relevance_check":
  // Update meeting state with relevance check data
  setMeetings(new Map(hub.meetings));
  break;
case "meeting.your_turn":
  // Update meeting state, show turn indicator
  setMeetings(new Map(hub.meetings));
  addToast("Your turn to speak!", "info");
  break;
case "meeting.awaiting_approval":
  // Update meeting state, show approval modal
  setMeetings(new Map(hub.meetings));
  break;
```

---

## Hub-Side Consideration: Human vs Agent

Currently the hub treats every connection as an agent. For human participation to work cleanly, the hub should eventually distinguish:

| | Agent | Human |
|---|---|---|
| **Relevance timeout** | 10s (fast LLM) | 30-60s (human thinking) |
| **Turn timeout** | 120s (LLM generation) | 300s (human typing) |
| **Auto-pass** | Never | On relevance timeout |
| **Display** | Agent name | Human name + indicator |

This is a hub change, not a client change. For now, the human connects as an agent (e.g., `ceo`) and the existing timeouts apply. Longer timeouts can be added later as a hub feature.

---

## Outdated References in PLAN.md

- Hub repo path: `~/workspaces/vibe/archon` → should be `~/archon`
- Client repo name: `archon-client` → now `archon-web`
- Missing protocol messages in Section 7: `meeting.relevance`, `meeting.approve`, `meeting.leave`
- Milestone 2 (Meeting History): partially done — `meeting.history` and `meeting.transcript` are wired but UI needs work
- Milestone 3 (Agent Management): partially done — CRUD is wired, detail panel exists

---

*Source: archon-lens cross-project analysis comparing `archon/src/protocol/messages.ts` (InboundMessage union) against `archon-web/src/lib/ws.ts` (handleMessage switch) and `archon-web/src/App.tsx` (useHub dispatch).*
