import { useEffect, useRef, useState } from "react";
import type { MeetingState } from "../lib/types";
import { PhaseIndicator } from "./PhaseIndicator";
import { VotePanel } from "./VotePanel";
import { ActionItems } from "./ActionItems";

const AGENT_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  ceo: { text: "text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/40" },
  alice: { text: "text-violet-400", bg: "bg-violet-500", ring: "ring-violet-500/40" },
  bob: { text: "text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/40" },
};

const FALLBACK_COLOR = { text: "text-blue-400", bg: "bg-blue-500", ring: "ring-blue-500/40" };

function agentStyle(id: string) {
  return AGENT_COLORS[id] ?? FALLBACK_COLOR;
}

function AgentAvatar({ agentId, glow }: { agentId: string; glow?: boolean }) {
  const style = agentStyle(agentId);
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${style.bg} ${glow ? "animate-avatar-glow ring-2 " + style.ring : ""}`}
      style={glow ? { color: "var(--tw-ring-color, currentColor)" } : undefined}
    >
      {agentId.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-message-in">
      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
        <div className="flex gap-1 items-center">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400" />
        </div>
      </div>
      <span className="text-xs text-zinc-600 italic">Agents thinking...</span>
    </div>
  );
}

export function MeetingRoom({
  meeting,
  onAdvance,
  onSpeak,
}: {
  meeting: MeetingState;
  onAdvance: () => void;
  onSpeak: (content: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thinkingVisible, setThinkingVisible] = useState(false);

  const isInitiatorOnly = meeting.capabilities.includes("initiator_only");
  const isActive = meeting.status === "active" && !isInitiatorOnly;
  const msgCount = meeting.messages.length;

  // Show thinking indicator after a delay when agents are processing
  useEffect(() => {
    if (!isActive) return;

    setThinkingVisible(false);
    const timer = setTimeout(() => setThinkingVisible(true), msgCount > 0 ? 1500 : 300);
    return () => clearTimeout(timer);
  }, [msgCount, isActive]);

  const showThinking = thinkingVisible && isActive;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgCount, showThinking]);

  const lastMsgAgentId = meeting.messages.length > 0
    ? meeting.messages[meeting.messages.length - 1].agentId
    : null;

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
        <PhaseIndicator phase={meeting.phase} status={meeting.status} phases={meeting.phases} />
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {meeting.messages.length === 0 && !showThinking && (
          <p className="text-zinc-600 text-sm text-center py-8">Waiting for messages...</p>
        )}
        {meeting.messages.map((msg, i) => {
          const style = agentStyle(msg.agentId);
          const isLatest = i === meeting.messages.length - 1;
          const prevMsg = i > 0 ? meeting.messages[i - 1] : null;
          const sameAgent = prevMsg?.agentId === msg.agentId;

          return (
            <div key={msg.id} className="animate-message-in flex gap-3 items-start">
              {sameAgent ? (
                <div className="w-8 shrink-0" />
              ) : (
                <AgentAvatar
                  agentId={msg.agentId}
                  glow={isLatest && msg.agentId === lastMsgAgentId}
                />
              )}
              <div className="min-w-0 flex-1">
                {!sameAgent && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${style.text}`}>
                      {msg.agentId}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase">{msg.phase}</span>
                    <span className="text-[10px] text-zinc-700">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}

        {showThinking && <ThinkingIndicator />}

        {meeting.status === "completed" && (
          <div className="text-center py-4 border-t border-zinc-800 mt-4 animate-message-in">
            <span className="text-emerald-400 font-bold text-sm">Meeting Completed</span>
          </div>
        )}
      </div>

      {/* Proposals & votes (DECIDE phase) */}
      {meeting.proposals.length > 0 && <VotePanel proposals={meeting.proposals} />}

      {/* Action items (ASSIGN phase) */}
      {meeting.actionItems.length > 0 && <ActionItems items={meeting.actionItems} />}

      {/* Chat input */}
      {meeting.status === "active" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = input.trim();
            if (trimmed) {
              onSpeak(trimmed);
              setInput("");
            }
          }}
          className="p-3 border-t border-zinc-800 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Speak in meeting..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              input.trim()
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
