# AGENTS.md

This project uses specialized AI review agents from the Archon hub to review code changes. The agents participate in Archon meetings — discussing diffs, identifying issues, and producing action items.

## Review Agents

| Agent | Role | Focus |
|-------|------|-------|
| `code-reviewer` | Senior Code Reviewer | Correctness, type safety, security, test coverage, protocol sync |
| `ux-reviewer` | UX Engineer & Accessibility Specialist | Accessibility, loading/error states, responsiveness, visual consistency |

## Agent Identity Files

Each agent has identity files in `~/.archon/agents/<agent-id>/`:

- **SOUL.md** — Personality, communication style, values, philosophy. Shapes *how* the agent communicates.
- **IDENTITY.md** — Role, expertise, strengths, weaknesses. Shapes *what* the agent focuses on.

The hub loads these as the agent's system prompt when spawning.

## How It Works

1. Create agent identity files in `~/.archon/agents/<agent-id>/`
2. Register the agent in the hub DB (via seed or the client UI)
3. The hub spawns agent processes that load SOUL.md + IDENTITY.md as their system prompt
4. Agents join a meeting with your code diff as the agenda
5. They discuss from their specialized perspectives (code quality vs UX)
6. The meeting produces decisions and action items

## Adding a New Review Agent

1. Create a directory: `~/.archon/agents/<agent-id>/`
2. Write `SOUL.md` — define personality and communication style
3. Write `IDENTITY.md` — define role, expertise, strengths, weaknesses
4. Register in DB: use the client UI or add to hub seed (`~/archon/src/db/seed.ts`)
5. Use it: `bash ~/archon/scripts/review-meeting.sh --agents code-reviewer,ux-reviewer,<agent-id>`

## LLM Provider Configuration

Review agents use whatever LLM provider is configured in their `modelConfig` (set in DB). Default: `cli-claude` with `sonnet` model.

Supported providers:
- `cli-claude` — Uses your local Claude CLI auth (recommended)
- `cli-gemini` — Uses your local Gemini CLI auth
- `openai` — Any OpenAI-compatible API (OpenRouter, Ollama, etc.)

## Project UI Skill

This worktree has a project-local UI skill at:

- `.agents/skills/archon-web-ui/`

Use `archon-web-ui` for operator-facing interface work in this worktree:

- layout and navigation changes
- task/meeting/history observability surfaces
- workflow board hierarchy work
- deciding what should be prominent, hidden, collapsed, or interruptive

Treat the docs in `docs/` as supporting rationale and roadmap.
Treat `archon-web-ui` as the active reusable style/workflow surface for future UI changes in this worktree.
