import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnection } from "./lib/ws";
import type {
  AgentCard, HubMessage, MeetingState, Toast,
  Department, Role, MeetingSummary, TranscriptEntry, HubConfig, WorkflowTask,
} from "./lib/types";
import { MeetingRoom } from "./components/MeetingRoom";
import { MeetingLauncher } from "./components/MeetingLauncher";
import { AgentDetailPanel } from "./components/AgentDetailPanel";
import { AgentCreateForm } from "./components/AgentCreateForm";
import { DepartmentManager } from "./components/DepartmentManager";
import { RoleManager } from "./components/RoleManager";
import { MeetingHistory } from "./components/MeetingHistory";
import { MeetingTranscript } from "./components/MeetingTranscript";
import { ConnectionSettings } from "./components/ConnectionSettings";
import { HubSettings } from "./components/HubSettings";
import { Toasts } from "./components/Toasts";
import { WorkflowBoard } from "./components/WorkflowBoard";
import "./app-shell.css";

const hub = new HubConnection("ws://localhost:9500", "ceo");

type View = "home" | "agent-detail" | "agent-create" | "departments" | "roles" | "meeting-history" | "meeting-transcript" | "active-meetings" | "workflow-board" | "settings";
type TranscriptReturnView = "meeting-history" | "workflow-board";

function sortTasks(tasks: WorkflowTask[]): WorkflowTask[] {
  return [...tasks].sort((left, right) => (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  ));
}

function upsertTask(tasks: WorkflowTask[], task: WorkflowTask): WorkflowTask[] {
  const index = tasks.findIndex((entry) => entry.id === task.id);
  if (index === -1) return sortTasks([...tasks, task]);

  const nextTasks = [...tasks];
  nextTasks[index] = task;
  return sortTasks(nextTasks);
}

function useHub() {
  const [connected, setConnected] = useState(false);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meetings, setMeetings] = useState<Map<string, MeetingState>>(new Map());
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
  const [activeMeetingsList, setActiveMeetingsList] = useState<Array<{
    meetingId: string; title: string; phase: string; initiator: string; participants: string[]; status: string;
  }>>([]);
  const [meetingHistory, setMeetingHistory] = useState<MeetingSummary[]>([]);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [workflowTaskTotal, setWorkflowTaskTotal] = useState(0);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcript, setTranscript] = useState<{
    meeting: { id: string; title: string; status: string; methodology: string; initiatorId: string; agenda: unknown; decisions: unknown[]; actionItems: unknown[]; summary: string | null; createdAt: string; completedAt: string | null };
    messages: TranscriptEntry[];
    participants: string[];
  } | null>(null);
  const toastCounter = useRef(0);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = String(++toastCounter.current);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const connectAs = useCallback((agentId: string, url: string) => {
    setAgents([]);
    setDepartments([]);
    setRoles([]);
    setMeetings(new Map());
    setActiveMeetingId(null);
    setMeetingHistory([]);
    setWorkflowTasks([]);
    setWorkflowTaskTotal(0);
    setTranscriptLoading(false);
    setTranscript(null);
    hub.reconnect(agentId, url);
  }, []);

  useEffect(() => {
    const unsub = hub.onMessage((msg: HubMessage) => {
      switch (msg.type) {
        case "auth.ok":
          setConnected(true);
          hub.listTasks();
          // Restore active meetings on reconnect
          if (hub.meetings.size > 0) {
            setMeetings(new Map(hub.meetings));
            // Auto-open the first active meeting
            for (const [id, m] of hub.meetings) {
              if (m.status === "active") {
                setActiveMeetingId(id);
                break;
              }
            }
          }
          break;
        case "auth.error":
          setConnected(false);
          break;
        case "directory.result":
          setAgents(msg.agents);
          break;
        case "directory.updated":
          // Agent list will be refreshed by ws.ts handler
          break;
        case "agent.created":
          addToast(`Agent "${msg.displayName}" created`, "success");
          break;
        case "agent.updated":
          addToast(`Agent "${msg.agentId}" updated`, "success");
          break;
        case "agent.deleted":
          addToast(`Agent "${msg.agentId}" deactivated`, "success");
          break;
        case "department.result":
          setDepartments(msg.departments);
          break;
        case "department.created":
          addToast(`Department "${msg.name}" created`, "success");
          hub.listDepartments();
          break;
        case "department.updated":
          hub.listDepartments();
          break;
        case "department.deleted":
          hub.listDepartments();
          break;
        case "role.result":
          setRoles(msg.roles);
          break;
        case "role.created":
          addToast(`Role "${msg.name}" created`, "success");
          hub.listRoles();
          break;
        case "role.updated":
          hub.listRoles();
          break;
        case "role.deleted":
          hub.listRoles();
          break;
        case "meeting.created":
          setMeetings(new Map(hub.meetings));
          setActiveMeetingId(msg.meetingId);
          break;
        case "meeting.invite":
          setMeetings(new Map(hub.meetings));
          setActiveMeetingId(msg.meetingId);
          addToast(`Invited to meeting: ${msg.title}`, "info");
          break;
        case "meeting.phase_change":
          setMeetings(new Map(hub.meetings));
          addToast(`Phase changed to ${msg.phase.toUpperCase()}`, "info");
          break;
        case "meeting.message":
        case "meeting.proposal":
        case "meeting.vote_result":
        case "meeting.action_item":
          setMeetings(new Map(hub.meetings));
          break;
        case "meeting.completed":
          setMeetings(new Map(hub.meetings));
          addToast("Meeting completed", "success");
          break;
        case "meeting.cancelled":
          setMeetings(new Map(hub.meetings));
          addToast(`Meeting cancelled: ${msg.reason}`, "warning");
          break;
        case "meeting.relevance_check":
          setMeetings(new Map(hub.meetings));
          addToast(`Relevance check: do you want to respond?`, "info");
          break;
        case "meeting.your_turn":
          setMeetings(new Map(hub.meetings));
          addToast("Your turn to speak!", "info");
          break;
        case "meeting.awaiting_approval":
          setMeetings(new Map(hub.meetings));
          addToast(`Phase "${msg.currentPhase}" complete — approve transition?`, "info");
          break;
        case "config.result":
          setHubConfig(msg.config);
          break;
        case "meeting.active_list.result":
          setActiveMeetingsList(msg.meetings);
          break;
        case "meeting.history.result":
          setMeetingHistory(msg.meetings);
          break;
        case "meeting.transcript.result":
          setTranscriptLoading(false);
          setTranscript({
            meeting: msg.meeting,
            messages: msg.messages,
            participants: msg.participants,
          });
          break;
        case "task.list.result":
          setWorkflowTasks(sortTasks(msg.tasks));
          setWorkflowTaskTotal(msg.total);
          break;
        case "task.created":
          setWorkflowTasks((prev) => upsertTask(prev, msg.task));
          setWorkflowTaskTotal((prev) => Math.max(prev + 1, 1));
          break;
        case "task.updated":
          setWorkflowTasks((prev) => upsertTask(prev, msg.task));
          setWorkflowTaskTotal((prev) => Math.max(prev, 1));
          break;
        case "agents.spawned":
          addToast(`Spawning agents: ${msg.agentIds.join(", ")}`, "info");
          break;
        case "agents.spawn_failed":
          for (const f of msg.failures) {
            addToast(`Failed to spawn ${f.agentId}: ${f.reason}`, "warning");
          }
          break;
        case "agent.process_error":
          addToast(`Agent ${msg.agentId} crashed: ${msg.reason}`, "warning");
          break;
        case "error":
          setTranscriptLoading(false);
          addToast(`${msg.message}`, "warning");
          break;
      }
    });

    return () => {
      unsub();
      hub.disconnect();
    };
  }, [addToast]);

  return {
    connected, agents, departments, roles, meetings,
    activeMeetingId, setActiveMeetingId,
    activeMeetingsList, setActiveMeetingsList,
    hubConfig,
    workflowTasks, workflowTaskTotal,
    transcriptLoading, setTranscriptLoading,
    toasts, dismissToast, connectAs,
    meetingHistory, transcript, setTranscript,
  };
}

function App() {
  const {
    connected, agents, departments, roles, meetings,
    activeMeetingId, setActiveMeetingId,
    activeMeetingsList,
    hubConfig,
    workflowTasks, workflowTaskTotal,
    transcriptLoading, setTranscriptLoading,
    toasts, dismissToast, connectAs,
    meetingHistory, transcript, setTranscript,
  } = useHub();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [transcriptReturnView, setTranscriptReturnView] = useState<TranscriptReturnView>("meeting-history");
  const [historyFilter, setHistoryFilter] = useState("all");

  const activeMeeting = activeMeetingId ? meetings.get(activeMeetingId) : null;
  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) ?? null : null;

  const handleStartMeeting = useCallback((title: string, invitees: string[], agenda: string, methodology?: string, summaryMode?: "off" | "structured" | "llm") => {
    hub.createMeeting(title, invitees, agenda, undefined, methodology, summaryMode);
  }, []);

  const navigateTo = useCallback((v: View) => {
    setView(v);
    setActiveMeetingId(null);
    setSelectedAgentId(null);
    if (v !== "meeting-transcript") {
      setTranscriptLoading(false);
      setTranscript(null);
    }
    setSidebarOpen(false);
  }, [setActiveMeetingId]);

  const openTranscript = useCallback((meetingId: string, returnView: TranscriptReturnView) => {
    setTranscriptReturnView(returnView);
    setTranscriptLoading(true);
    setTranscript(null);
    hub.getMeetingTranscript(meetingId);
    setView("meeting-transcript");
    setSidebarOpen(false);
  }, [setTranscript]);

  // Filter out CEO from invitee list
  const invitableAgents = agents.filter((a) => a.id !== hub.agentId);
  const completedMeetingCount = [...meetings.values()].filter((m) => m.status === "completed").length;

  if (!connected) {
    return (
      <div className="archon-shell">
        <ConnectionSettings
          currentAgentId={hub.agentId}
          currentUrl={hub.url}
          onConnect={connectAs}
        />
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const closeSidebar = () => setSidebarOpen(false);

  const renderMain = () => {
    // Meeting transcript view
    if (view === "meeting-transcript" && transcriptLoading && !transcript) {
      return (
        <div className="archon-shell__panel flex flex-1 items-center justify-center text-sm text-zinc-500">
          Loading transcript...
        </div>
      );
    }

    if (view === "meeting-transcript" && transcript) {
      return (
        <MeetingTranscript
          data={transcript}
          onBack={() => {
            setTranscript(null);
            setView(transcriptReturnView);
          }}
        />
      );
    }

    if (view === "workflow-board") {
      return (
        <WorkflowBoard
          tasks={workflowTasks}
          total={workflowTaskTotal}
          meetingHistory={meetingHistory}
          currentAgentId={hub.agentId}
          onRefresh={() => hub.listTasks()}
          onOpenMeeting={(meetingId) => openTranscript(meetingId, "workflow-board")}
        />
      );
    }

    // Active meetings browser
    if (view === "active-meetings") {
      return (
        <div className="archon-shell__panel overflow-y-auto">
          <div className="archon-shell__panel-header">
            <div>
              <h2 className="archon-shell__panel-title">Active Meetings</h2>
              <p className="archon-shell__panel-sub">Live hub rooms and joinable sessions.</p>
            </div>
            <button
              onClick={() => hub.listActiveMeetings()}
              className="archon-shell__button"
            >
              Refresh
            </button>
          </div>
          {activeMeetingsList.length === 0 ? (
            <div className="archon-shell__empty">No active meetings right now.</div>
          ) : (
            <div className="archon-shell__grid">
              {activeMeetingsList.map((m) => {
                const alreadyJoined = meetings.has(m.meetingId);
                return (
                  <div
                    key={m.meetingId}
                    className="archon-shell__panel-card archon-shell__meeting-card"
                  >
                    <div className="archon-shell__meeting-card-head">
                      <h3 className="archon-shell__meeting-card-title">{m.title}</h3>
                      <span className="archon-shell__meeting-card-phase">{m.phase}</span>
                    </div>
                    <div className="archon-shell__meeting-meta">
                      <span>Initiator: <strong>{m.initiator}</strong></span>
                      <span>Participants: <strong>{m.participants.join(", ")}</strong></span>
                    </div>
                    {alreadyJoined ? (
                      <button
                        onClick={() => {
                          setActiveMeetingId(m.meetingId);
                          setView("home");
                        }}
                        className="archon-shell__button archon-shell__button--success"
                      >
                        View Meeting
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          hub.joinMeeting(m.meetingId);
                          setView("home");
                        }}
                        className="archon-shell__button archon-shell__button--primary"
                      >
                        Join Meeting
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Meeting history view
    if (view === "meeting-history") {
      return (
        <MeetingHistory
          meetings={meetingHistory}
          onLoadMore={(cursor) => {
            hub.listMeetingHistory({
              status: historyFilter === "all" ? undefined : historyFilter as "active" | "completed" | "cancelled",
              cursor,
            });
          }}
          onViewTranscript={(meetingId) => openTranscript(meetingId, "meeting-history")}
          onClose={() => navigateTo("home")}
          statusFilter={historyFilter}
          onFilterChange={(f) => {
            setHistoryFilter(f);
            hub.listMeetingHistory({
              status: f === "all" ? undefined : f as "active" | "completed" | "cancelled",
            });
          }}
        />
      );
    }

    // Hub settings
    if (view === "settings") {
      return (
        <HubSettings
          config={hubConfig}
          onSet={(key, value) => hub.setConfig(key, value)}
          onClose={() => navigateTo("home")}
        />
      );
    }

    // Department manager
    if (view === "departments") {
      return (
        <DepartmentManager
          departments={departments}
          agents={agents}
          onCreate={(name, desc) => hub.createDepartment(name, desc)}
          onUpdate={(id, opts) => hub.updateDepartment(id, opts)}
          onDelete={(id) => hub.deleteDepartment(id)}
          onClose={() => navigateTo("home")}
        />
      );
    }

    // Role manager
    if (view === "roles") {
      return (
        <RoleManager
          roles={roles}
          departments={departments}
          onCreate={(deptId, name) => hub.createRole(deptId, name)}
          onUpdate={(id, opts) => hub.updateRole(id, opts)}
          onDelete={(id) => hub.deleteRole(id)}
          onClose={() => navigateTo("home")}
        />
      );
    }

    // Agent create form
    if (view === "agent-create") {
      return (
        <AgentCreateForm
          agents={agents}
          departments={departments}
          roles={roles}
          onSubmit={(name, displayName, opts) => {
            hub.createAgent(name, displayName, opts);
            navigateTo("home");
          }}
          onCancel={() => navigateTo("home")}
        />
      );
    }

    // Agent detail panel
    if (selectedAgent) {
      return (
        <AgentDetailPanel
          agent={selectedAgent}
          departments={departments}
          roles={roles}
          onClose={() => { setSelectedAgentId(null); setView("home"); }}
          onUpdate={(agentId, opts) => hub.updateAgent(agentId, opts)}
          onDelete={(agentId) => hub.deleteAgent(agentId)}
          onReactivate={(agentId) => hub.reactivateAgent(agentId)}
        />
      );
    }

    // Active meeting
    if (activeMeeting) {
      return (
        <MeetingRoom
          meeting={activeMeeting}
          onAdvance={() => hub.advanceMeeting(activeMeeting.id)}
          onSpeak={(content) => hub.speakInMeeting(activeMeeting.id, content)}
          onPropose={(proposal) => hub.proposeInMeeting(activeMeeting.id, proposal)}
          onVote={(idx, vote, reason) => hub.voteInMeeting(activeMeeting.id, idx, vote, reason)}
          onAssign={(task, assigneeId, deadline) => hub.assignInMeeting(activeMeeting.id, task, assigneeId, deadline)}
          onAcknowledge={(idx) => hub.acknowledgeInMeeting(activeMeeting.id, idx)}
          onCancel={() => hub.cancelMeeting(activeMeeting.id)}
          onRelevance={(level) => hub.sendRelevance(activeMeeting.id, level)}
          onApprove={() => hub.approveMeeting(activeMeeting.id)}
          participants={activeMeeting.participants}
        />
      );
    }

    // Default: meeting launcher
    return <MeetingLauncher agents={invitableAgents} onStart={handleStartMeeting} llmAvailable={hubConfig?.llmAvailable} />;
  };

  return (
    <div className="archon-shell relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="archon-shell__overlay md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`archon-shell__sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="archon-shell__sidebar-header">
          <div>
            <div className="archon-shell__brand">
              <span className="archon-shell__brand-mark">
                <span className="archon-shell__brand-dot" />
              </span>
              <span>Archon</span>
            </div>
            <div className="archon-shell__brand-meta">
              <span>connected</span>
              <span>·</span>
              <span>{hub.agentId}</span>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="archon-shell__close md:hidden"
          >
            &times;
          </button>
        </div>

        {/* Meeting list */}
        <div className="archon-shell__sidebar-body">
          <div className="archon-shell__section-label">Meetings</div>
          <button
            onClick={() => { navigateTo("home"); setActiveMeetingId(null); }}
            className="archon-shell__link"
          >
            <span className="archon-shell__link-title">+ New Meeting</span>
          </button>
          {[...meetings.values()].map((m) => (
            <button
              key={m.id}
              onClick={() => { setActiveMeetingId(m.id); setSelectedAgentId(null); setView("home"); closeSidebar(); }}
              className={`archon-shell__link${activeMeetingId === m.id ? " is-active" : ""}`}
            >
              <span className="archon-shell__meeting-link">
                <span className="archon-shell__link-title">{m.title}</span>
                <span className="archon-shell__meeting-phase">
                  {m.status === "active" ? m.phase.toUpperCase() : m.status.toUpperCase()}
                </span>
              </span>
            </button>
          ))}

          {/* Browse active meetings */}
          <button
            onClick={() => {
              hub.listActiveMeetings();
              navigateTo("active-meetings");
            }}
            className={`archon-shell__link${view === "active-meetings" ? " is-active" : ""}`}
          >
            <span className="archon-shell__link-title">Browse Active</span>
          </button>

          {/* History link */}
          <button
            onClick={() => navigateTo("meeting-history")}
            className={`archon-shell__link${view === "meeting-history" || view === "meeting-transcript" ? " is-active" : ""}`}
          >
            <span className="archon-shell__link-title">History</span>
            {completedMeetingCount > 0 && (
              <span className="archon-shell__link-meta">({completedMeetingCount})</span>
            )}
          </button>

          <button
            onClick={() => {
              hub.listTasks();
              navigateTo("workflow-board");
            }}
            className={`archon-shell__link${view === "workflow-board" ? " is-active" : ""}`}
          >
            <span className="archon-shell__link-title">Workflow Board</span>
            {workflowTaskTotal > 0 && (
              <span className="archon-shell__link-meta">({workflowTaskTotal})</span>
            )}
          </button>

          {/* Organization section */}
          <div className="archon-shell__section-label">Organization</div>
            <button
              onClick={() => navigateTo("departments")}
              className={`archon-shell__link${view === "departments" ? " is-active" : ""}`}
            >
              <span className="archon-shell__link-title">Departments</span>
              <span className="archon-shell__link-meta">({departments.length})</span>
            </button>
            <button
              onClick={() => navigateTo("roles")}
              className={`archon-shell__link${view === "roles" ? " is-active" : ""}`}
            >
              <span className="archon-shell__link-title">Roles</span>
              <span className="archon-shell__link-meta">({roles.length})</span>
            </button>
            <button
              onClick={() => {
                hub.getConfig();
                navigateTo("settings");
              }}
              className={`archon-shell__link${view === "settings" ? " is-active" : ""}`}
            >
              <span className="archon-shell__link-title">Settings</span>
            </button>
        </div>

        {/* Agents */}
        <div className="archon-shell__sidebar-footer">
          <div className="archon-shell__section-label">Agents ({agents.length})</div>
          <button
            onClick={() => navigateTo("agent-create")}
            className="archon-shell__link"
          >
            <span className="archon-shell__link-title">+ New Agent</span>
          </button>
          <div className="archon-shell__agent-list">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAgentId(a.id); setActiveMeetingId(null); setView("agent-detail"); closeSidebar(); }}
                className={`archon-shell__agent-link${selectedAgentId === a.id ? " is-active" : ""}`}
              >
                <div className={`archon-shell__agent-dot ${
                  a.activity?.startsWith("in_meeting:") ? "bg-amber-500" : a.activity === "connected" ? "bg-emerald-500" : "bg-zinc-600"
                }`} />
                <span className="archon-shell__agent-name">{a.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="archon-shell__main">
        {/* Mobile header */}
        <div className="archon-shell__mobile-header md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="archon-shell__mobile-menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="archon-shell__mobile-title">Archon</span>
        </div>

        {renderMain()}
      </div>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
