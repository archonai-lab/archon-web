# Archon Client — Plan

> v1.0 | Created: 2026-03-11
> Status: MVP scaffold done, iterating

---

## 1. What Is This?

Web client for the Archon platform — a dashboard to observe and control AI agent meetings in real-time. Connects to the Archon hub via WebSocket. The hub manages agent identity, meetings, and message routing. This client makes it visual and interactive.

**Hub repo**: `~/workspaces/vibe/archon` (separate project)

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 19 + TypeScript | Fast, type-safe UI |
| Build | Vite 7 | Instant HMR, fast builds |
| Styling | Tailwind CSS v4 | Utility-first, dark theme, no component library |
| Transport | Native WebSocket | Direct connection to hub on `:9500` |
| State | React hooks + `HubConnection` class | Lightweight, no external state lib needed yet |

---

## 3. Project Structure

```
archon-client/
├── src/
│   ├── App.tsx                      # Main layout: sidebar + main area
│   ├── main.tsx                     # React root
│   ├── index.css                    # Tailwind import
│   │
│   ├── lib/
│   │   ├── ws.ts                    # HubConnection: WebSocket client, reconnect, state tracking
│   │   └── types.ts                 # Protocol types mirroring hub's messages.ts + types.ts
│   │
│   └── components/
│       ├── MeetingRoom.tsx          # Real-time meeting view: messages, phase, budget
│       ├── MeetingLauncher.tsx      # Form to create meetings (title, agenda, agents)
│       ├── AgentList.tsx            # Agent list with status indicators
│       ├── AgentDetailPanel.tsx     # Full agent card display (description, departments, roles)
│       ├── ConnectionSettings.tsx   # Auth/identity selection before connecting
│       ├── VotePanel.tsx            # Proposal cards with vote visualization
│       ├── ActionItems.tsx          # Task list with assignees for ASSIGN phase
│       ├── Toasts.tsx               # Toast notification overlay
│       └── PhaseIndicator.tsx       # Visual PRESENT → DISCUSS → DECIDE → ASSIGN bar
│
├── index.html
├── vite.config.ts                   # React + Tailwind plugins
├── tsconfig.json
└── package.json
```

---

## 4. Hub Connection

The client connects to the hub as an agent (currently as `ceo`). All communication is via WebSocket JSON messages.

### Auth flow
1. Connect to `ws://localhost:9500`
2. Send `{ type: "auth", agentId: "ceo", token: "ceo" }`
3. Receive `auth.ok` → connected
4. Request agent directory: `{ type: "directory.list" }`
5. Keepalive: send `{ type: "ping" }` every 30s

### Meeting flow (client as initiator)
1. Send `meeting.create` with title, invitees, agenda
2. Hub sends `meeting.invite` to agents, `meeting.phase_change` to all
3. Agents speak via `meeting.speak`, hub broadcasts `meeting.message`
4. Client can send `meeting.advance` to push to next phase
5. Hub sends `meeting.completed` when done

### Meeting flow (client as observer)
1. Receive `meeting.invite` → auto-join with `meeting.join`
2. Receive `meeting.message`, `meeting.phase_change` events
3. Display in real-time chat view

---

## 5. Current State (What's Built)

### Done
- [x] Vite + React + TypeScript scaffold
- [x] Tailwind CSS v4 with dark theme
- [x] `HubConnection` class — WebSocket connect, auth, reconnect, ping
- [x] Protocol types mirroring hub messages
- [x] `App.tsx` — sidebar layout with meeting list + agent status
- [x] `MeetingRoom.tsx` — phase indicator, message stream, budget display
- [x] `MeetingLauncher.tsx` — create meeting form with agent selection
- [x] `AgentList.tsx` — agent list with online/offline/busy status
- [x] `PhaseIndicator.tsx` — visual phase progress bar

### MVP Remaining
- [ ] Meeting history view (browse past meetings from DB)
- [x] Agent detail panel (view full agent card, departments, roles)
- [x] Vote visualization in DECIDE phase (proposal cards with vote counts)
- [x] Action items display in ASSIGN phase (task list with assignees)
- [x] Toast notifications for meeting events (invite, phase change, completion)
- [x] Auth mode selection (connect as CEO, or as observer with custom ID)
- [x] Responsive layout for smaller screens

---

## 6. Milestones

### Milestone 1: Live Meeting (current)
> Watch and control meetings in real-time.

- [x] WebSocket connection + auth
- [x] Meeting creation UI
- [x] Real-time message stream
- [x] Phase indicator
- [x] Vote visualization (DECIDE)
- [x] Action items display (ASSIGN)
- [x] Toast notifications

**Deliverable**: Create a meeting from the client, watch agents discuss, see it complete.

### Milestone 2: Meeting History
> Browse past meetings and their outcomes.

- [ ] REST API or WebSocket query for past meetings (needs hub endpoint)
- [ ] Meeting list view with filters (date, status, initiator)
- [ ] Meeting transcript viewer (full message history)
- [ ] Decisions and action items summary panel

**Deliverable**: Browse any past meeting's transcript and outcomes.

### Milestone 3: Agent Management
> View and manage agents in the org.

- [ ] Agent detail panel (full agent card display)
- [ ] Department/role hierarchy view
- [ ] Agent status history
- [ ] Agent identity editor (SOUL.md / IDENTITY.md) — stretch goal

**Deliverable**: Full org chart visibility with agent cards.

### Milestone 4: Polish & Production
> Make it production-ready.

- [ ] Auth UI (select agent identity, future: JWT login)
- [ ] Responsive design
- [ ] Error boundaries and loading states
- [ ] WebSocket connection status indicator with manual reconnect
- [ ] Settings panel (hub URL, theme)
- [ ] Keyboard shortcuts (advance phase, focus input)

**Deliverable**: Polished, production-grade client.

---

## 7. Hub Protocol Reference

Source of truth is the hub repo. Key files:

| Hub File | What |
|----------|------|
| `src/protocol/messages.ts` | All WebSocket message Zod schemas |
| `src/meeting/types.ts` | Meeting phases, relevance levels, proposals, action items |
| `src/hub/router.ts` | Message routing and handler dispatch |
| `src/db/schema.ts` | Full Postgres schema (9 tables) |
| `scripts/start-meeting.ts` | Reference: how to create and facilitate a meeting |
| `scripts/agent.ts` | Reference: how agents connect and participate |

### Message types the client cares about

**Send (client → hub):**
`auth`, `meeting.create`, `meeting.join`, `meeting.speak`, `meeting.advance`, `meeting.propose`, `meeting.vote`, `meeting.assign`, `meeting.acknowledge`, `directory.list`, `ping`

**Receive (hub → client):**
`auth.ok`, `auth.error`, `meeting.invite`, `meeting.phase_change`, `meeting.message`, `meeting.relevance_check`, `meeting.your_turn`, `meeting.proposal`, `meeting.vote_result`, `meeting.action_item`, `meeting.completed`, `meeting.cancelled`, `directory.result`, `error`, `pong`

---

## 8. Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npx tsc --noEmit   # Type check
```

### Testing against the hub

```bash
# Terminal 1: Start hub
cd ~/workspaces/vibe/archon
docker compose up -d && npx tsx src/index.ts

# Terminal 2: Start agents
npx tsx scripts/agent.ts --id alice --provider cli-claude --model haiku
# Terminal 3:
npx tsx scripts/agent.ts --id bob --provider cli-gemini

# Terminal 4: Start client
cd ~/workspaces/vibe/archon-client
npm run dev
# Open http://localhost:5173
```

---

## 9. Design Principles

- **Dark theme only** (for now) — zinc-950 backgrounds, zinc-200 text
- **No component libraries** — Tailwind utilities only, keep it lean
- **Real-time first** — everything updates via WebSocket, no polling
- **Hub is the source of truth** — client never writes to DB directly
- **Agent-colored messages** — each agent gets a distinct color in the chat

---

*Last updated: 2026-03-12*
