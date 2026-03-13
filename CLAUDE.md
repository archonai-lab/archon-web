# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server with HMR (localhost:5173)
npm run build      # TypeScript check + production build to dist/
npm run lint       # ESLint (flat config, v9)
npm run preview    # Preview production build
npm test           # Run vitest component tests
npm run test:watch # Run vitest in watch mode
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

## Planning Cross-Repo Features

When implementing features that span hub + client:

1. **Protocol first**: Define new message schemas in the hub's `src/protocol/messages.ts` (Zod) before touching client code
2. **Hub handlers second**: Add switch cases in `src/hub/router.ts`, implement business logic in `src/registry/` or `src/meeting/`
3. **Client types third**: Mirror the new messages as plain TS types in `src/lib/types.ts`
4. **Client WS helpers**: Add send methods to `HubConnection` in `src/lib/ws.ts`, handle new inbound messages in `handleMessage()`
5. **UI components last**: Build React components that call ws.ts helpers and render from state

## UI/UX Patterns

- **Background**: `bg-zinc-950` (page), `bg-zinc-900` (cards), `bg-zinc-800` (inputs, buttons)
- **Text**: `text-zinc-200` (body), `text-zinc-400` (secondary), `text-zinc-500` (labels), `text-zinc-600` (muted)
- **Accent**: `bg-blue-600 hover:bg-blue-500` (primary buttons), `text-blue-400` (links)
- **Status dots**: `bg-emerald-500` (online/success), `bg-amber-500` (busy/warning), `bg-zinc-600` (offline)
- **Toast notifications**: via `addToast(message, type)` in useHub — types: `info`, `success`, `warning`
- **Forms**: `bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm` with `focus:ring-1 focus:ring-blue-500`
- **Responsive sidebar**: Fixed left panel (w-64) with transform toggle for mobile, overlay backdrop on small screens
- **Section labels**: `text-xs font-medium text-zinc-500 uppercase` for sidebar section headers
- **Confirmation dialogs**: Use `window.confirm()` for destructive actions (delete agent, etc.)

## Component Architecture

Components receive data from the `useHub()` hook in App.tsx and call HubConnection methods for mutations:

```
useHub() → subscribes to hub.onMessage() → dispatches by msg.type → updates React state
  ├── agents: AgentCard[]            ← directory.result
  ├── meetings: Map<string, MeetingState>  ← meeting.* events
  ├── departments: Department[]      ← department.result
  ├── roles: Role[]                  ← role.result
  ├── connected: boolean             ← auth.ok / auth.error
  └── toasts: Toast[]               ← addToast() from handlers
```

**New component checklist**:
1. Define props interface with the data it needs + callback functions for actions
2. Import types from `src/lib/types.ts`
3. Use Tailwind classes matching the dark theme palette above
4. Call hub methods (e.g., `hub.createAgent()`) from App.tsx callbacks passed as props

## Review Pipeline (MANDATORY)

**After every feature addition, bug fix, or significant code change, you MUST run the review pipeline before considering the work done.**

### Option A: Single-agent review (fast, ~30s)

```bash
npm run review              # Review all uncommitted changes
npm run review:staged       # Review only staged changes
npm run review:branch       # Review full branch diff vs main
```

Review scripts live in the hub repo (`~/archon/scripts/`). The npm scripts point there.
For advanced options: `bash ~/archon/scripts/review.sh --help`

### Option B: Archon review meeting (thorough, multi-agent discussion)

```bash
npm run review:meeting      # Default: code-reviewer + ux-reviewer
```

Dogfoods Archon itself — creates a real meeting where specialized review agents discuss your changes and produce decisions + action items. Requires the hub running. See `AGENTS.md` for agent details.
For advanced options: `bash ~/archon/scripts/review-meeting.sh --help`

### Workflow
1. Implement the feature or fix
2. Run `npm run review` (fast) or `npm run review:meeting` (thorough)
3. Read the findings / meeting transcript
4. Fix all Critical and Warning issues
5. Re-run review to verify fixes
6. Only then is the work considered done

Do NOT skip this step.

## Protocol Sync Checklist

When the hub adds new message types, update the client in this order:

1. `src/lib/types.ts` — Add inbound/outbound message interfaces, add to `HubMessage` union
2. `src/lib/ws.ts` — Add send helper methods, handle new inbound messages in `handleMessage()`
3. `src/App.tsx` — Add cases to `useHub()` message dispatcher, add new state if needed
4. Components — Build/update components that use the new messages
5. Verify: `npm run review`
