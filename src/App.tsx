import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnection } from "./lib/ws";
import type { AgentCard, HubMessage, MeetingState, Toast } from "./lib/types";
import { MeetingRoom } from "./components/MeetingRoom";
import { MeetingLauncher } from "./components/MeetingLauncher";
import { AgentDetailPanel } from "./components/AgentDetailPanel";
import { ConnectionSettings } from "./components/ConnectionSettings";
import { Toasts } from "./components/Toasts";

const hub = new HubConnection("ws://localhost:9500", "ceo");

function useHub() {
  const [connected, setConnected] = useState(false);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [meetings, setMeetings] = useState<Map<string, MeetingState>>(new Map());
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
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
    setMeetings(new Map());
    setActiveMeetingId(null);
    hub.reconnect(agentId, url);
  }, []);

  useEffect(() => {
    const unsub = hub.onMessage((msg: HubMessage) => {
      switch (msg.type) {
        case "auth.ok":
          setConnected(true);
          break;
        case "auth.error":
          setConnected(false);
          break;
        case "directory.result":
          setAgents(msg.agents);
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

  return { connected, agents, meetings, activeMeetingId, setActiveMeetingId, toasts, dismissToast, connectAs };
}

function App() {
  const { connected, agents, meetings, activeMeetingId, setActiveMeetingId, toasts, dismissToast, connectAs } = useHub();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeMeeting = activeMeetingId ? meetings.get(activeMeetingId) : null;
  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) ?? null : null;

  const handleStartMeeting = useCallback((title: string, invitees: string[], agenda: string, methodology?: string) => {
    hub.createMeeting(title, invitees, agenda, undefined, methodology);
  }, []);

  // Filter out CEO from invitee list
  const invitableAgents = agents.filter((a) => a.id !== hub.agentId);

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
              onClick={() => { setActiveMeetingId(null); setSelectedAgentId(null); closeSidebar(); }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + New
            </button>
          </div>
          {[...meetings.values()].map((m) => (
            <button
              key={m.id}
              onClick={() => { setActiveMeetingId(m.id); setSelectedAgentId(null); closeSidebar(); }}
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
        </div>

        {/* Agents */}
        <div className="p-3 border-t border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 uppercase block mb-2">
            Agents ({agents.length})
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAgentId(a.id); setActiveMeetingId(null); closeSidebar(); }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors text-left ${
                  selectedAgentId === a.id ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  a.status === "online" ? "bg-emerald-500" : a.status === "busy" ? "bg-amber-500" : "bg-zinc-600"
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

        {selectedAgent ? (
          <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgentId(null)} />
        ) : activeMeeting ? (
          <MeetingRoom
            meeting={activeMeeting}
            onAdvance={() => hub.advanceMeeting(activeMeeting.id)}
            onSpeak={(content) => hub.speakInMeeting(activeMeeting.id, content)}
          />
        ) : (
          <MeetingLauncher agents={invitableAgents} onStart={handleStartMeeting} />
        )}
      </div>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
