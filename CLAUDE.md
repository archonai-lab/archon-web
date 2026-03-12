# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server with HMR (localhost:5173)
npm run build      # TypeScript check + production build to dist/
npm run lint       # ESLint (flat config, v9)
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check only (strict mode, no unused locals/params)
```

Testing requires the hub running separately:
```bash
# Hub: cd ~/workspaces/vibe/archon && docker compose up -d && npx tsx src/index.ts
# Agents: npx tsx scripts/agent.ts --id alice --provider cli-claude --model haiku
# Client: npm run dev → http://localhost:5173
```

## Architecture

React 19 + TypeScript app that connects to the Archon hub (`ws://localhost:9500`) to observe and control AI agent meetings in real-time.

**`src/lib/ws.ts` — HubConnection class**: Singleton WebSocket client handling connect, auth (as "ceo"), reconnect (3s backoff), 30s ping keepalive, and meeting operations. Tracks all meeting state in a `Map<string, MeetingState>`. Exposes `onMessage(fn)` for subscribing to hub messages (returns unsubscribe).

**`src/App.tsx` — useHub() hook**: Central state manager. Subscribes to HubConnection messages and dispatches by `msg.type` to update React state (agents, meetings, activeMeetingId, connected). This is where all hub→UI state transitions happen.

**`src/lib/types.ts`**: TypeScript types mirroring the hub's protocol (`src/protocol/messages.ts` and `src/meeting/types.ts` in the hub repo). Must stay in sync with the hub — the hub uses Zod schemas, this client uses plain TS types.

**Components** render from the state managed in App.tsx. MeetingRoom displays the real-time chat stream with auto-scroll. MeetingLauncher creates meetings. PhaseIndicator shows the PRESENT→DISCUSS→DECIDE→ASSIGN progression.

## Hub Protocol

Client authenticates as an agent, then sends/receives JSON messages over WebSocket. Key flows:
- **Auth**: send `auth` → receive `auth.ok` → send `directory.list` → receive `directory.result`
- **Create meeting**: send `meeting.create` → receive `meeting.invite` + `meeting.phase_change` + `meeting.message` stream → `meeting.completed`
- **Observe meeting**: receive `meeting.invite` → auto-join → receive message stream

Hub repo: `~/workspaces/vibe/archon` — protocol source of truth is there.

## Conventions

- **Dark theme only**: zinc-950 backgrounds, zinc-200 text. No light mode.
- **No component libraries**: Tailwind CSS v4 utilities only, no shadcn/MUI/etc.
- **No external state libraries**: React hooks + HubConnection class. No Redux/Zustand.
- **Real-time first**: All data flows through WebSocket. No REST endpoints, no polling.
- **Hub is source of truth**: Client never writes to DB. All mutations go through the hub.
- **Agent-colored messages**: Each agent gets a deterministic color in chat (color map in MeetingRoom).
- Roadmap and remaining work tracked in `PLAN.md`.
