import { useEffect, useMemo, useState } from "react";
import type { MeetingSummary, TaskStatus, WorkflowTask } from "../lib/types";
import "./workflow-board.css";

const STATUS_ORDER: TaskStatus[] = ["failed", "in_progress", "pending", "done"];

const STATUS_COPY: Record<TaskStatus, {
  label: string;
  tone: "failed" | "active" | "pending" | "done";
  tileSub: (tasks: WorkflowTask[]) => string;
}> = {
  failed: {
    label: "Failed",
    tone: "failed",
    tileSub: () => "needs review",
  },
  in_progress: {
    label: "Active",
    tone: "active",
    tileSub: (tasks) => `${tasks.filter(isStale).length} stale >30m`,
  },
  pending: {
    label: "Pending",
    tone: "pending",
    tileSub: (tasks) => `${tasks.filter((task) => !task.assignedTo).length} unassigned`,
  },
  done: {
    label: "Done",
    tone: "done",
    tileSub: () => "last 24h",
  },
};

const PROJECT_TONES = [
  { background: "rgba(244,114,182,.12)", color: "#f9a8d4" },
  { background: "rgba(6,182,212,.12)", color: "#67e8f9" },
  { background: "rgba(245,158,11,.12)", color: "#fcd34d" },
  { background: "rgba(139,92,246,.12)", color: "#c4b5fd" },
  { background: "rgba(16,185,129,.12)", color: "#6ee7b7" },
];

const GLOBAL_WORKFLOW_VIEWERS = new Set(["ceo", "levia"]);

const AGENT_TONES: Record<string, { background: string; borderColor: string; color: string }> = {
  ceo: { background: "rgba(245,158,11,.12)", borderColor: "rgba(245,158,11,.22)", color: "#fcd34d" },
  rune: { background: "rgba(6,182,212,.12)", borderColor: "rgba(6,182,212,.22)", color: "#67e8f9" },
  sable: { background: "rgba(244,114,182,.12)", borderColor: "rgba(244,114,182,.22)", color: "#f9a8d4" },
  alice: { background: "rgba(139,92,246,.12)", borderColor: "rgba(139,92,246,.22)", color: "#c4b5fd" },
  kalyx: { background: "rgba(249,115,22,.12)", borderColor: "rgba(249,115,22,.22)", color: "#fdba74" },
};

function statusTone(status: TaskStatus): "failed" | "active" | "pending" | "done" {
  if (status === "in_progress") return "active";
  return STATUS_COPY[status].tone;
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isStale(task: WorkflowTask): boolean {
  if (task.status !== "in_progress") return false;
  const timestamp = new Date(task.updatedAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > 30 * 60_000;
}

function basename(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/\/+$/, "").split("/").pop() ?? value;
}

function deriveProjectTag(task: WorkflowTask): string {
  if (task.projectTag?.trim()) return task.projectTag.trim();
  const repoScope = task.repoScope as { targetRepo?: string } | null;
  const targetRepo = basename(repoScope?.targetRepo);
  if (targetRepo) {
    if (targetRepo.includes("workflow-observability")) return "workflow-obs";
    if (targetRepo === "archon-agent") return "platform";
    if (targetRepo === "archon") return "exec-substrate";
    return targetRepo;
  }
  return task.meetingId ? "meeting" : "direct";
}

function deriveRepoName(task: WorkflowTask): string {
  const worktree = basename(task.worktree);
  if (worktree) return worktree;
  const repoScope = task.repoScope as { targetRepo?: string } | null;
  const targetRepo = basename(repoScope?.targetRepo);
  if (targetRepo) return targetRepo;
  return task.meetingId ? "meeting-task" : "direct-task";
}

function deriveWorkflowName(task: WorkflowTask, meetings: MeetingSummary[]): string {
  if (task.workflowName?.trim()) return task.workflowName.trim();
  if (!task.meetingId) return "Direct task";
  return meetings.find((meeting) => meeting.id === task.meetingId)?.title ?? task.meetingId;
}

function projectToneStyle(tag: string) {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) >>> 0;
  }
  return PROJECT_TONES[hash % PROJECT_TONES.length];
}

function agentToneStyle(agentId: string | null) {
  if (!agentId) {
    return {
      background: "rgba(39,39,42,.95)",
      borderColor: "#3f3f46",
      color: "#a1a1aa",
    };
  }
  return AGENT_TONES[agentId] ?? {
    background: "rgba(39,39,42,.95)",
    borderColor: "#3f3f46",
    color: "#d4d4d8",
  };
}

function groupTasks(tasks: WorkflowTask[]): Record<TaskStatus, WorkflowTask[]> {
  return {
    failed: tasks.filter((task) => task.status === "failed"),
    in_progress: tasks.filter((task) => task.status === "in_progress"),
    pending: tasks.filter((task) => task.status === "pending"),
    done: tasks.filter((task) => task.status === "done"),
  };
}

function meetingMeta(meeting: MeetingSummary | null): string {
  if (!meeting) return "Direct assignment";
  return `${meeting.participantCount} participants · ${meeting.phase} phase`;
}

function taskTimeline(task: WorkflowTask) {
  return [
    {
      id: "created",
      label: `Task created${task.assignedTo ? ` — assigned to ${task.assignedTo}` : ""}`,
      value: new Date(task.createdAt).toLocaleString(),
      tone: "active" as const,
    },
    {
      id: "updated",
      label: `Status → ${task.status}${task.exitCode != null ? ` · exit ${task.exitCode}` : ""}`,
      value: new Date(task.updatedAt).toLocaleString(),
      tone: statusTone(task.status),
    },
  ];
}

function TaskModal({
  task,
  meeting,
  onClose,
  onOpenMeeting,
}: {
  task: WorkflowTask;
  meeting: MeetingSummary | null;
  onClose: () => void;
  onOpenMeeting: (meetingId: string) => void;
}) {
  const [debugOpen, setDebugOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(360);
  const tone = statusTone(task.status);
  const projectTag = deriveProjectTag(task);
  const projectTone = projectToneStyle(projectTag);
  const agentTone = agentToneStyle(task.assignedTo);
  const repoName = deriveRepoName(task);
  const workflowName = deriveWorkflowName(task, meeting ? [meeting] : []);
  const timeline = taskTimeline(task);
  const debugRows = [
    ["exec id", task.execId ?? "—"],
    ["codex session", task.codexSessionId ?? "—"],
    ["model", task.model ?? "—"],
    ["runtime", task.durationMs != null ? `${Math.round(task.durationMs / 1000)}s` : "—"],
    ["exit code", task.exitCode != null ? String(task.exitCode) : "—"],
    ["worktree", task.worktree ?? "—"],
    ["git sha", task.gitSha ?? "—"],
  ];

  useEffect(() => {
    setDebugOpen(true);
  }, [task.id]);

  useEffect(() => {
    setLeftPanelWidth(360);
  }, [task.id]);

  function startResize(clientX: number) {
    const startX = clientX;
    const startWidth = leftPanelWidth;

    const onMove = (event: MouseEvent) => {
      const delta = event.clientX - startX;
      const next = Math.min(560, Math.max(280, startWidth + delta));
      setLeftPanelWidth(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleResizeMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    startResize(event.clientX);
  }

  return (
    <div className="workflow-modal-overlay">
      <button
        type="button"
        aria-label="Close task details"
        className="workflow-modal-scrim"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${task.title} details`}
        className="workflow-modal"
        style={{ ["--workflow-left-panel-width" as string]: `${leftPanelWidth}px` }}
      >
        <div className="workflow-modal-header" data-tone={tone}>
          <span className="workflow-row-dot" data-tone={tone} />
          <span className="workflow-status-pill" data-tone={tone}>{STATUS_COPY[task.status].label}</span>
          <span className="workflow-agent-chip" style={agentTone}>{task.assignedTo ?? "—"}</span>
          <button type="button" className="workflow-modal-close" onClick={onClose}>
            <span>✕</span>
            <span className="workflow-modal-close-label">esc</span>
          </button>
        </div>

        <div className="workflow-modal-title-bar">
          <div className="workflow-modal-title">{task.title}</div>
          <div className="workflow-modal-sub">
            <span>{repoName}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span className="workflow-project-tag" style={projectTone}>
              <span>◈</span>
              {projectTag}
            </span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{formatRelativeTime(task.updatedAt)}</span>
          </div>
        </div>

        <div className="workflow-modal-body">
          <div className="workflow-modal-col workflow-modal-col-left">
            <section className="workflow-drawer-section">
              <div className="workflow-drawer-label">Project & Workflow</div>
              <div className="workflow-context-box">
                <div className="workflow-context-row">
                  <span className="workflow-context-key">project</span>
                  <span className="workflow-context-value is-highlight">{repoName}</span>
                </div>
                <div className="workflow-context-row">
                  <span className="workflow-context-key">workflow</span>
                  <span className="workflow-context-value">{workflowName}</span>
                </div>
                <div className="workflow-context-row">
                  <span className="workflow-context-key">task id</span>
                  <span className="workflow-context-value" style={{ fontFamily: "var(--font-archon-mono)" }}>{task.id}</span>
                </div>
                <div className="workflow-context-row">
                  <span className="workflow-context-key">worktree</span>
                  <span className="workflow-context-value" style={{ fontFamily: "var(--font-archon-mono)", fontSize: "11px" }}>
                    {task.worktree ?? "—"}
                  </span>
                </div>
              </div>
            </section>

            {task.description && (
              <section className="workflow-drawer-section">
                <div className="workflow-drawer-label">Description</div>
                <div className="workflow-description-box">{task.description}</div>
              </section>
            )}

            <section className="workflow-drawer-section">
              <div className="workflow-drawer-label">Timeline</div>
              <div className="workflow-timeline">
                {timeline.map((entry) => (
                  <div key={entry.id} className="workflow-timeline-item">
                    <span className="workflow-timeline-node" data-tone={entry.tone} />
                    <div className="workflow-timeline-event">{entry.label}</div>
                    <div className="workflow-timeline-ts">{entry.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="workflow-drawer-section">
              <div className="workflow-drawer-label">Meeting Origin</div>
              <div className="workflow-meeting-box">
                <div>
                  <div className="workflow-meeting-name">{meeting?.title ?? "No linked meeting"}</div>
                  <div className="workflow-meeting-meta">{meetingMeta(meeting)}</div>
                </div>
                {task.meetingId ? (
                  <button
                    type="button"
                    className="workflow-transcript-btn"
                    onClick={() => onOpenMeeting(task.meetingId!)}
                  >
                    Open transcript →
                  </button>
                ) : null}
              </div>
            </section>
          </div>

          <button
            type="button"
            aria-label="Resize task detail panels"
            className="workflow-modal-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <span className="workflow-modal-resize-grip" />
          </button>

          <div className="workflow-modal-col workflow-modal-col-right">
            <section className="workflow-drawer-section">
              <div className="workflow-drawer-label">Result</div>
              <div className="workflow-result-box">
                <div className="workflow-result-header" data-tone={tone}>
                  <span className="workflow-result-header-label">
                    {task.status === "failed" ? "Error output" : "Persisted result"}
                  </span>
                  {task.exitCode != null ? (
                    <span className="workflow-result-exit">exit {task.exitCode}</span>
                  ) : null}
                </div>
                <pre className={`workflow-result-pre${task.status === "failed" ? " is-failed" : ""}`}>
                  {task.result ?? "(no persisted result)"}
                </pre>
              </div>
            </section>

            <section className="workflow-drawer-section">
              <div className="workflow-drawer-label">Debug & Provenance</div>
              <div className="workflow-debug-box">
                <button
                  type="button"
                  className="workflow-debug-toggle"
                  onClick={() => setDebugOpen((value) => !value)}
                >
                  <span className="workflow-debug-title">Execution Details</span>
                  <span className="workflow-debug-chevron">{debugOpen ? "▲ collapse" : "▼ expand"}</span>
                </button>
                {debugOpen ? (
                  <div className="workflow-debug-grid">
                    {debugRows.map(([label, value]) => (
                      <div key={label} className="contents">
                        <span className="workflow-debug-key">{label}</span>
                        <span className="workflow-debug-value">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorkflowBoard({
  tasks,
  total,
  meetingHistory,
  currentAgentId,
  onRefresh,
  onOpenMeeting,
}: {
  tasks: WorkflowTask[];
  total: number;
  meetingHistory: MeetingSummary[];
  currentAgentId: string;
  onRefresh: () => void;
  onOpenMeeting: (meetingId: string) => void;
}) {
  const grouped = useMemo(() => groupTasks(tasks), [tasks]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedMeeting = selectedTask?.meetingId
    ? meetingHistory.find((meeting) => meeting.id === selectedTask.meetingId) ?? null
    : null;

  return (
    <div className="workflow-board-shell" data-modal-open={selectedTask ? "true" : "false"}>
      <div className="workflow-board-surface">
        <div className="workflow-board-header">
          <div>
            <div className="workflow-board-title">Workflow Board</div>
            <div className="workflow-board-meta">
              <span className="workflow-board-live">
                <span className="workflow-board-live-dot" />
                <span>live · {tasks.length} of {total} tasks</span>
              </span>
            </div>
          </div>
          <button type="button" className="workflow-board-refresh" onClick={onRefresh}>
            ↻ Refresh
          </button>
        </div>

        <div className="workflow-tiles">
          {STATUS_ORDER.map((status) => {
            const sectionTasks = grouped[status];
            const tone = STATUS_COPY[status].tone;
            return (
              <section key={status} className="workflow-tile" data-tone={tone}>
                <span className="workflow-tile-count">{sectionTasks.length}</span>
                <span className="workflow-tile-label">{STATUS_COPY[status].label}</span>
                <span className="workflow-tile-sub">{STATUS_COPY[status].tileSub(sectionTasks)}</span>
              </section>
            );
          })}
        </div>

        {!GLOBAL_WORKFLOW_VIEWERS.has(currentAgentId) ? (
          <div className="workflow-scope-note">
            <span>
              Viewing task scope for <strong>{currentAgentId}</strong>. The global workflow board currently requires <strong>ceo</strong>, <strong>levia</strong>, or equivalent admin task permissions.
            </span>
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <div className="workflow-empty">
            {GLOBAL_WORKFLOW_VIEWERS.has(currentAgentId)
              ? "No workflow tasks found."
              : `No tasks are visible for ${currentAgentId}. This is a scoped task view, not the global CEO board.`}
          </div>
        ) : (
          STATUS_ORDER.map((status) => {
            const sectionTasks = grouped[status];
            if (sectionTasks.length === 0) return null;

            const tone = STATUS_COPY[status].tone;
            const isDone = status === "done";
            const visibleTasks = isDone && !doneExpanded ? [] : sectionTasks;

            return (
              <section key={status} className="workflow-section">
                <div className="workflow-section-header">
                  <span className="workflow-section-dot" data-tone={tone} />
                  <span className="workflow-section-label" data-tone={tone}>{STATUS_COPY[status].label}</span>
                  <span className="workflow-section-count" data-tone={tone}>{sectionTasks.length}</span>
                  {isDone ? (
                    <button
                      type="button"
                      className="workflow-section-toggle"
                      onClick={() => setDoneExpanded((value) => !value)}
                    >
                      {doneExpanded ? "collapse ↑" : "expand ↓"}
                    </button>
                  ) : null}
                </div>

                {isDone && !doneExpanded ? (
                  <button
                    type="button"
                    className="workflow-section-collapsed"
                    onClick={() => setDoneExpanded(true)}
                  >
                    <span>{sectionTasks.length} completed tasks — last 24h</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-archon-mono)", fontSize: "10px" }}>▶ expand</span>
                  </button>
                ) : (
                  <div className="workflow-task-list">
                    {visibleTasks.map((task) => {
                      const taskTone = statusTone(task.status);
                      const projectTag = deriveProjectTag(task);
                      const projectTone = projectToneStyle(projectTag);
                      const agentTone = agentToneStyle(task.assignedTo);
                      const repoName = deriveRepoName(task);
                      const stale = isStale(task);

                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={`workflow-task-row${selectedTaskId === task.id ? " is-open" : ""}${task.status === "in_progress" ? " is-active" : ""}`}
                          data-tone={taskTone}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <span className="workflow-row-dot" data-tone={taskTone} />
                          <div className="workflow-row-content">
                            <div className="workflow-row-title">{task.title}</div>
                            <div className="workflow-row-sub">
                              <strong style={{ color: agentTone.color }}>{task.assignedTo ?? "unassigned"}</strong>
                              <span className="workflow-row-sub-sep">·</span>
                              <span>{repoName}</span>
                              <span className="workflow-row-sub-sep">·</span>
                              <span className="workflow-project-tag" style={projectTone}>
                                <span>◈</span>
                                {projectTag}
                              </span>
                            </div>
                          </div>
                          <div className="workflow-row-right">
                            {stale ? (
                              <span className="workflow-stale-badge">
                                <span className="workflow-stale-dot" />
                                {Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / 60_000)}m
                              </span>
                            ) : null}
                            <span className="workflow-agent-chip" style={agentTone}>{task.assignedTo ?? "—"}</span>
                            <span className="workflow-row-time">{formatRelativeTime(task.updatedAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {selectedTask ? (
        <TaskModal
          task={selectedTask}
          meeting={selectedMeeting}
          onClose={() => setSelectedTaskId(null)}
          onOpenMeeting={onOpenMeeting}
        />
      ) : null}
    </div>
  );
}
