---
name: archon-web-ui
description: "Use when designing or editing the archon-web interface. This skill carries the stable UI direction for operator-facing surfaces: observability first, dark-theme consistency, human-readable status over backend detail, and deliberate use of interrupts instead of passive toasts for actions that need attention."
---

# Archon Web UI

Use this skill for `archon-web` interface work.

This is the project-local UI contract for the worktree. The redesign and observability docs are supporting rationale; this skill is the active guidance surface for future UI changes.

## When to use

- You are changing `archon-web` layout, navigation, or information hierarchy.
- You are adding or refining operator-facing views such as meetings, tasks, history, agents, or settings.
- You are deciding whether something should be a dashboard surface, a sidebar item, a card field, a modal, or an interrupt.
- You need to keep the UI aligned across separate PRs instead of re-deriving the visual and product direction each time.

## Core direction

The UI is for operators, not backend developers.

Prioritize:

- current system state before creation forms
- human-readable status before raw identifiers
- real-time visibility before manual refresh habits
- explicit, visible interrupts for decisions that need attention
- visual hierarchy that separates live state from navigation

## Information hierarchy

Default order of importance:

1. what is happening now
2. what needs attention
3. what the operator can do next
4. lower-frequency org/configuration surfaces

Concrete rules:

- active meetings and task state should outrank creation tools on the home/default experience
- real-time sections should be visually separate from plain navigation links
- failed or stuck work should be easier to notice than completed work
- tasks should show title, assignee, status, and recency before any deep detail
- meeting context should be visible from tasks when relevant

## Visual rules

- dark theme only unless the repo direction changes explicitly
- use semantic color to do real work:
  - blue for active/in-progress
  - emerald for success/completed
  - amber for warning/attention
  - red for failure/critical
- avoid flat zinc-on-zinc monotony when status should be visually legible
- preserve the existing `archon-web` dark palette and component feel instead of introducing a separate design language

## Palette

Use these tokens by default unless a specific screen has a strong reason to vary them.

### Surfaces

- page background: `bg-zinc-950`
- primary surface: `bg-zinc-900`
- secondary surface / controls: `bg-zinc-800`
- subtle overlay or recessed surface: `bg-zinc-950/60`

### Text

- primary text: `text-zinc-100`
- body text: `text-zinc-300`
- secondary text: `text-zinc-400`
- muted labels: `text-zinc-500`
- low-emphasis placeholder text: `text-zinc-600`

### Borders

- default border: `border-zinc-800`
- stronger control border: `border-zinc-700`

### Actions

- primary action: `bg-blue-600 hover:bg-blue-500 text-white`
- secondary action: `bg-zinc-800 hover:bg-zinc-700 text-zinc-300`
- interactive text link: `text-blue-400 hover:text-blue-300`

### Status colors

- in progress / active:
  - `bg-blue-950/40 text-blue-300 border-blue-800/60`
- success / done:
  - `bg-emerald-950/40 text-emerald-300 border-emerald-800/60`
- warning / attention:
  - `bg-amber-950/40 text-amber-300 border-amber-800/60`
- failure / critical:
  - `bg-red-950/40 text-red-300 border-red-800/60`

### Focus

- focus ring: `focus:ring-1 focus:ring-blue-500`
- keep focus visible on all inputs and action buttons

## Interaction rules

- use toasts for passive feedback only
- do not use toasts for actions that require a decision
- relevance checks, your turn, and phase approvals are interrupt surfaces, not snackbars
- do not expose backend implementation details unless the operator genuinely needs them

Examples of details to demote or remove:

- raw UUID fragments as primary labels
- optimistic concurrency version numbers
- null-state placeholders like `unknown` when a cleaner omission is possible

## Workflow observability rules

For workflow task and meeting surfaces:

- default sort by most recent activity
- emphasize:
  - status
  - assignee
  - last activity
  - meeting/source context
- collapse long result bodies by default when needed
- failed tasks must be visually distinct
- direct and meeting-created tasks should both be understandable without reading raw backend fields
- active meetings belong in a real-time section, not mixed with ordinary navigation items

## Navigation rules

- separate live resources from navigation targets
- active meetings belong in a real-time section
- tasks and history are navigation targets, not live meeting items
- people/org/settings should be visually demoted compared with active operational state

## Process

1. Start from the operator journey, not the component tree.
2. Decide what matters most on first glance.
3. Remove or demote backend detail that does not help operators act.
4. Prefer one clean hierarchy over many equal-weight panels.
5. Keep the change aligned with existing `archon-web` patterns unless the redesign direction explicitly changes them.

## Example

If you add a workflow board:

- do show status, assignee, recency, and source meeting context
- do not lead with raw task IDs or version counters
- do make failed tasks easier to notice than completed ones
- do keep it read-only unless the workflow explicitly needs mutation UI
