import { useState, useEffect, useCallback } from "react";
import { HubConnection } from "./lib/ws";
import type { AgentCard, HubMessage, MeetingState } from "./lib/types";
import { MeetingRoom } from "./components/MeetingRoom";
import { MeetingLauncher } from "./components/MeetingLauncher";

const hub = new HubConnection("ws://localhost:9500", "ceo");

function useHub() {
  const [connected, setConnected] = useState(false);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [meetings, setMeetings] = useState<Map<string, MeetingState>>(new Map());
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  useEffect(() => {
    hub.connect();

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
        case "meeting.invite":
          setMeetings(new Map(hub.meetings));
          setActiveMeetingId(msg.meetingId);
          break;
        case "meeting.phase_change":
        case "meeting.message":
        case "meeting.completed":
        case "meeting.cancelled":
          setMeetings(new Map(hub.meetings));
          break;
      }
    });

    return () => {
      unsub();
      hub.disconnect();
    };
  }, []);

  return { connected, agents, meetings, activeMeetingId, setActiveMeetingId };
}

function App() {
  const { connected, agents, meetings, activeMeetingId, setActiveMeetingId } = useHub();
  const [view, setView] = useState<"launcher" | "meeting">("launcher");

  const activeMeeting = activeMeetingId ? meetings.get(activeMeetingId) : null;

  const handleStartMeeting = useCallback((title: string, invitees: string[], agenda: string) => {
    hub.createMeeting(title, invitees, agenda);
    setView("meeting");
  }, []);

  // Switch to meeting view when a meeting starts
  useEffect(() => {
    if (activeMeeting) setView("meeting");
  }, [activeMeeting]);

  // Filter out CEO from invitee list
  const invitableAgents = agents.filter((a) => a.id !== hub.agentId);

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-200">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-100">Archon</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-xs text-zinc-500">
              {connected ? `Connected as ${hub.agentId}` : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Meeting list */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase">Meetings</span>
            <button
              onClick={() => { setView("launcher"); setActiveMeetingId(null); }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + New
            </button>
          </div>
          {[...meetings.values()].map((m) => (
            <button
              key={m.id}
              onClick={() => { setActiveMeetingId(m.id); setView("meeting"); }}
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
        <div className="mt-auto p-3 border-t border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 uppercase block mb-2">
            Agents ({agents.length})
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-2 py-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  a.status === "online" ? "bg-emerald-500" : a.status === "busy" ? "bg-amber-500" : "bg-zinc-600"
                }`} />
                <span className="text-xs text-zinc-400 truncate">{a.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {view === "launcher" || !activeMeeting ? (
          <MeetingLauncher agents={invitableAgents} onStart={handleStartMeeting} />
        ) : (
          <MeetingRoom
            meeting={activeMeeting}
            onAdvance={() => hub.advanceMeeting(activeMeeting.id)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
