import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnection } from "./lib/ws";
import type {
  AgentCard, HubMessage, MeetingState, Toast,
  Department, Role, MeetingSummary, TranscriptEntry, HubConfig,
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

const hub = new HubConnection("ws://localhost:9500", "ceo");

type View = "home" | "agent-detail" | "agent-create" | "departments" | "roles" | "meeting-history" | "meeting-transcript" | "active-meetings" | "settings";

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
    setTranscript(null);
    hub.reconnect(agentId, url);
  }, []);

  useEffect(() => {
    const unsub = hub.onMessage((msg: HubMessage) => {
      switch (msg.type) {
        case "auth.ok":
          setConnected(true);
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
          setTranscript({
            meeting: msg.meeting,
            messages: msg.messages,
            participants: msg.participants,
          });
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
    toasts, dismissToast, connectAs,
    meetingHistory, transcript, setTranscript,
  } = useHub();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>("home");
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
    setSidebarOpen(false);
  }, [setActiveMeetingId]);

  // Filter out CEO from invitee list
  const invitableAgents = agents.filter((a) => a.id !== hub.agentId);
  const completedMeetingCount = [...meetings.values()].filter((m) => m.status === "completed").length;

  if (!connected) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-200">
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
    if (view === "meeting-transcript" && transcript) {
      return (
        <MeetingTranscript
          data={transcript}
          onBack={() => { setTranscript(null); setView("meeting-history"); }}
        />
      );
    }

    // Active meetings browser
    if (view === "active-meetings") {
      return (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-100">Active Meetings</h2>
            <button
              onClick={() => hub.listActiveMeetings()}
              className="px-3 py-1 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          {activeMeetingsList.length === 0 ? (
            <p className="text-zinc-500 text-sm">No active meetings right now.</p>
          ) : (
            <div className="space-y-3">
              {activeMeetingsList.map((m) => {
                const alreadyJoined = meetings.has(m.meetingId);
                return (
                  <div
                    key={m.meetingId}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-zinc-200">{m.title}</h3>
                      <span className="text-xs font-mono text-zinc-500 uppercase">{m.phase}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                      <span>Initiator: <span className="text-zinc-400">{m.initiator}</span></span>
                      <span>Participants: <span className="text-zinc-400">{m.participants.join(", ")}</span></span>
                    </div>
                    {alreadyJoined ? (
                      <button
                        onClick={() => {
                          setActiveMeetingId(m.meetingId);
                          setView("home");
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        View Meeting
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          hub.joinMeeting(m.meetingId);
                          setView("home");
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
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
          onViewTranscript={(meetingId) => {
            hub.getMeetingTranscript(meetingId);
            setView("meeting-transcript");
          }}
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
          participants={activeMeeting.participants}
        />
      );
    }

    // Default: meeting launcher
    return <MeetingLauncher agents={invitableAgents} onStart={handleStartMeeting} llmAvailable={hubConfig?.llmAvailable} />;
  };

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-200 relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:flex-shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Archon</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500">
                Connected as {hub.agentId}
              </span>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-zinc-500 hover:text-zinc-300 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Meeting list */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase">Meetings</span>
            <button
              onClick={() => { navigateTo("home"); setActiveMeetingId(null); }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + New
            </button>
          </div>
          {[...meetings.values()].map((m) => (
            <button
              key={m.id}
              onClick={() => { setActiveMeetingId(m.id); setSelectedAgentId(null); setView("home"); closeSidebar(); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                activeMeetingId === m.id
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <div className="truncate font-medium">{m.title}</div>
              <div className="text-xs text-zinc-600">
                {m.status === "active" ? m.phase.toUpperCase() : m.status.toUpperCase()}
              </div>
            </button>
          ))}

          {/* Browse active meetings */}
          <button
            onClick={() => {
              hub.listActiveMeetings();
              navigateTo("active-meetings");
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "active-meetings"
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-500 hover:bg-zinc-800/50"
            }`}
          >
            <span className="text-xs">Browse Active</span>
          </button>

          {/* History link */}
          <button
            onClick={() => navigateTo("meeting-history")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "meeting-history" || view === "meeting-transcript"
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-500 hover:bg-zinc-800/50"
            }`}
          >
            <span className="text-xs">History</span>
            {completedMeetingCount > 0 && (
              <span className="text-xs text-zinc-600 ml-1">({completedMeetingCount})</span>
            )}
          </button>

          {/* Organization section */}
          <div className="mt-4">
            <span className="text-xs font-medium text-zinc-500 uppercase block mb-2">Organization</span>
            <button
              onClick={() => navigateTo("departments")}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 transition-colors ${
                view === "departments" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              Departments ({departments.length})
            </button>
            <button
              onClick={() => navigateTo("roles")}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 transition-colors ${
                view === "roles" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              Roles ({roles.length})
            </button>
            <button
              onClick={() => {
                hub.getConfig();
                navigateTo("settings");
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 transition-colors ${
                view === "settings" ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Agents */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase">
              Agents ({agents.length})
            </span>
            <button
              onClick={() => navigateTo("agent-create")}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + New
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAgentId(a.id); setActiveMeetingId(null); setView("agent-detail"); closeSidebar(); }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors text-left ${
                  selectedAgentId === a.id ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  a.activity?.startsWith("in_meeting:") ? "bg-amber-500" : a.activity === "connected" ? "bg-emerald-500" : "bg-zinc-600"
                }`} />
                <span className="text-xs text-zinc-400 truncate">{a.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-zinc-100">Archon</span>
        </div>

        {renderMain()}
      </div>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
