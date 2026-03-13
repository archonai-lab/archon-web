# Archon Client

Web UI for the [Archon](https://github.com/leviathanst/archon) platform — observe and control AI agent meetings in real-time.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires the Archon hub running separately:
```bash
cd ~/archon
docker compose up -d       # Start Postgres
npm run db:seed            # Seed agents + departments
npx tsx src/index.ts       # Start hub on ws://localhost:9500
```

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** — dark theme only, no component libraries
- **Vite 7** — dev server + build
- **WebSocket** — real-time connection to Archon hub
- **vitest** + **React Testing Library** — component tests

## Commands

```bash
npm run dev            # Vite dev server with HMR
npm run build          # TypeScript check + production build
npm run lint           # ESLint
npm test               # Run component tests (vitest)
npm run test:watch     # Run tests in watch mode
npm run review         # Code review via Claude agent
npm run review:meeting # Code review via Archon meeting (multi-agent)
```

## Project Structure

```
src/
  App.tsx              # Main app + useHub() state manager
  lib/
    ws.ts              # HubConnection — WebSocket client
    types.ts           # Protocol types (mirrors hub schemas)
  components/
    MeetingLauncher    # Create new meetings
    MeetingRoom        # Live meeting chat stream
    MeetingTranscript  # Read-only transcript viewer
    MeetingHistory     # Past meetings browser
    PhaseIndicator     # Phase progress bar
    HubSettings        # LLM configuration
    AgentDetailPanel   # Agent info + edit
    AgentCreateForm    # Create new agents
tests/                 # Component tests (vitest + RTL)
e2e/                   # Playwright E2E tests
agents/                # Review agent identities (SOUL.md + IDENTITY.md)
scripts/
  review.sh            # Single-agent code review pipeline
  review-meeting.sh    # Multi-agent Archon review meeting
```

## Review Pipeline

This project uses AI-powered code review as part of the development workflow. Two options:

### Single-agent review (fast)

```bash
npm run review            # Review uncommitted changes
npm run review:staged     # Review staged changes only
npm run review:branch     # Review full branch vs main
```

Runs tests + type check, then sends the diff to a Claude reviewer agent. Takes ~30 seconds.

### Archon review meeting (thorough)

```bash
npm run review:meeting
```

Dogfoods Archon itself — creates a real meeting where specialized review agents discuss your changes:

- **code-reviewer** — Focuses on correctness, type safety, security, test coverage
- **ux-reviewer** — Focuses on accessibility, loading/error states, visual consistency

The agents join a meeting with your diff as the agenda, discuss issues from their perspectives, and produce action items. Requires the hub running.

See [AGENTS.md](./AGENTS.md) for details on review agents, how to add new ones, and how to customize them.

## Testing

```bash
npm test                  # Run all component tests
npm run test:watch        # Watch mode
npx vitest run tests/meeting-room.test.tsx  # Single file
```

Tests use vitest + React Testing Library with jsdom. Test files live in `tests/` and cover:
- MeetingLauncher — summary mode, form validation, onStart callback
- MeetingRoom — messages, controls, summary display, proposals, assignments
- MeetingTranscript — phase grouping, summary, decisions, action items
- HubSettings — LLM config, save/close, status display
- PhaseIndicator — phase styling, active/past/future states

## Architecture

The client connects to the Archon hub via WebSocket. All data flows through the real-time connection — no REST, no polling.

```
Hub (ws://localhost:9500)
  ↕ WebSocket (JSON messages)
HubConnection (src/lib/ws.ts)
  ↕ onMessage callbacks
useHub() hook (src/App.tsx)
  ↕ React state
Components
```

Key flows:
- **Auth**: `auth` → `auth.ok` → `directory.list` → `directory.result`
- **Meeting**: `meeting.create` → `meeting.invite` → `meeting.phase_change` → `meeting.message` stream → `meeting.completed`
- **Config**: `config.get` → `config.result` / `config.set` → `config.result`
