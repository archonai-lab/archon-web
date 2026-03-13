import type { TranscriptEntry } from "../lib/types";

interface TranscriptData {
  meeting: {
    id: string;
    title: string;
    status: string;
    methodology: string;
    initiatorId: string;
    agenda: unknown;
    decisions: unknown[];
    actionItems: unknown[];
    summary: string | null;
    createdAt: string;
    completedAt: string | null;
  };
  messages: TranscriptEntry[];
  participants: string[];
}

export function MeetingTranscript({
  data,
  onBack,
}: {
  data: TranscriptData;
  onBack: () => void;
}) {
  const { meeting, messages, participants } = data;

  // Group messages by phase
  const phases: Array<{ phase: string; messages: TranscriptEntry[] }> = [];
  let currentPhase = "";
  for (const msg of messages) {
    if (msg.phase !== currentPhase) {
      currentPhase = msg.phase;
      phases.push({ phase: currentPhase, messages: [] });
    }
    phases[phases.length - 1].messages.push(msg);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 text-sm">
              &larr; Back
            </button>
            <h2 className="text-lg font-bold text-zinc-100">{meeting.title}</h2>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${
            meeting.status === "completed"
              ? "bg-emerald-500/20 text-emerald-400"
              : meeting.status === "cancelled"
              ? "bg-red-500/20 text-red-400"
              : "bg-blue-500/20 text-blue-400"
          }`}>
            {meeting.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{meeting.methodology}</span>
          <span>·</span>
          <span>Initiated by {meeting.initiatorId}</span>
          <span>·</span>
          <span>{new Date(meeting.createdAt).toLocaleString()}</span>
          <span>·</span>
          <span>{participants.length} participants</span>
        </div>
        {meeting.agenda != null && (
          <p className="text-xs text-zinc-500">{String(meeting.agenda)}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Meeting summary */}
        {meeting.summary && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase mb-2">Summary</h3>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{meeting.summary}</div>
          </div>
        )}

        {/* Transcript by phase */}
        {phases.map((phaseGroup, pi) => (
          <div key={pi}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-zinc-500 uppercase bg-zinc-900 px-2 py-1 rounded">
                {phaseGroup.phase}
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-3">
              {phaseGroup.messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {msg.agentId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-bold text-zinc-300">{msg.displayName}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">{msg.agentId}</span>
                      <span className="text-[10px] text-zinc-700">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">No messages in this meeting.</p>
        )}

        {/* Decisions summary */}
        {meeting.decisions.length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase mb-2">Decisions</h3>
            <div className="space-y-2">
              {meeting.decisions.map((d, i) => (
                <div key={i} className="bg-emerald-500/10 rounded-lg px-3 py-2 text-sm text-emerald-300">
                  {typeof d === "object" && d !== null && "proposal" in d
                    ? String((d as { proposal: string }).proposal)
                    : JSON.stringify(d)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action items summary */}
        {meeting.actionItems.length > 0 && (
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase mb-2">Action Items</h3>
            <div className="space-y-1.5">
              {meeting.actionItems.map((item, i) => {
                const a = item as { task?: string; assigneeId?: string; deadline?: string };
                return (
                  <div key={i} className="bg-zinc-900 rounded-lg px-3 py-2 flex items-start gap-3">
                    <span className="text-xs text-zinc-500 mt-0.5">{i + 1}.</span>
                    <div>
                      <p className="text-sm text-zinc-200">{a.task ?? JSON.stringify(item)}</p>
                      <div className="flex gap-2 text-xs text-zinc-500 mt-0.5">
                        {a.assigneeId && <span>Assigned to {a.assigneeId}</span>}
                        {a.deadline && <span className="text-amber-400">Due: {a.deadline}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
