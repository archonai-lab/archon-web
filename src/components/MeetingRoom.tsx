import { useEffect, useRef } from "react";
import type { MeetingState } from "../lib/types";
import { PhaseIndicator } from "./PhaseIndicator";

const AGENT_COLORS: Record<string, string> = {
  ceo: "text-amber-400",
  alice: "text-violet-400",
  bob: "text-emerald-400",
};

function agentColor(id: string): string {
  return AGENT_COLORS[id] ?? "text-blue-400";
}

export function MeetingRoom({
  meeting,
  onAdvance,
}: {
  meeting: MeetingState;
  onAdvance: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [meeting.messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">{meeting.title}</h2>
          {meeting.status === "active" && (
            <button
              onClick={onAdvance}
              className="px-3 py-1 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Advance Phase
            </button>
          )}
        </div>
        <PhaseIndicator phase={meeting.phase} status={meeting.status} />
        {meeting.agenda && (
          <p className="text-xs text-zinc-500">
            {meeting.agenda.length > 200 ? meeting.agenda.slice(0, 200) + "..." : meeting.agenda}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">Budget remaining:</span>
          <span className="text-xs font-mono text-zinc-400">
            {meeting.budgetRemaining.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {meeting.messages.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-8">Waiting for messages...</p>
        )}
        {meeting.messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={`text-sm font-bold ${agentColor(msg.agentId)}`}>
                {msg.agentId}
              </span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase">{msg.phase}</span>
              <span className="text-[10px] text-zinc-700">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
          </div>
        ))}

        {meeting.status === "completed" && (
          <div className="text-center py-4 border-t border-zinc-800 mt-4">
            <span className="text-emerald-400 font-bold text-sm">Meeting Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
