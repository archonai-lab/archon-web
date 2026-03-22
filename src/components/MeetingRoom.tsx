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

function ThinkingIndicator({ agentId }: { agentId?: string }) {
  const style = agentId ? agentStyle(agentId) : null;
  return (
    <div className="flex items-center gap-3 animate-message-in">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style ? style.bg : "bg-zinc-700"}`}>
        <div className="flex gap-1 items-center">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
        </div>
      </div>
      <span className={`text-xs italic ${style ? style.text : "text-zinc-600"}`}>
        {agentId ? `${agentId} thinking...` : "Agents thinking..."}
      </span>
    </div>
  );
}

export function MeetingRoom({
  meeting,
  onAdvance,
  onSpeak,
  onPropose,
  onVote,
  onAssign,
  onAcknowledge,
  onCancel,
  onRelevance,
  onApprove,
  participants,
}: {
  meeting: MeetingState;
  onAdvance: () => void;
  onSpeak: (content: string) => void;
  onPropose?: (proposal: string) => void;
  onVote?: (proposalIndex: number, vote: "approve" | "reject" | "abstain", reason?: string) => void;
  onAssign?: (task: string, assigneeId: string, deadline?: string) => void;
  onAcknowledge?: (taskIndex: number) => void;
  onCancel?: () => void;
  onRelevance?: (level: "must_speak" | "could_add" | "pass") => void;
  onApprove?: () => void;
  participants?: string[];
}) {
  const [input, setInput] = useState("");
  const [proposalInput, setProposalInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thinkingVisible, setThinkingVisible] = useState(false);

  const isInitiatorOnly = meeting.capabilities.includes("initiator_only");
  const hasProposals = meeting.capabilities.includes("proposals");
  const hasAssignments = meeting.capabilities.includes("assignments");
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
            <div className="flex items-center gap-2">
              <button
                onClick={onAdvance}
                className="px-3 py-1 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Advance Phase
              </button>
              {onCancel && (
                <button
                  onClick={() => {
                    if (window.confirm("Cancel this meeting? All participants will be notified.")) {
                      onCancel();
                    }
                  }}
                  className="px-3 py-1 rounded text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
        <PhaseIndicator phase={meeting.phase} status={meeting.status} phases={meeting.phases} />
        {meeting.phaseDescription && meeting.status === "active" && (
          <p className="text-xs text-zinc-400 bg-zinc-900 rounded px-3 py-1.5 italic">
            {meeting.phaseDescription}
          </p>
        )}
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

        {showThinking && <ThinkingIndicator agentId={
          // Show the next expected speaker (exclude last speaker + the observing CEO)
          meeting.participants.find((p) => p !== lastMsgAgentId && p !== "ceo")
        } />}

        {meeting.status === "completed" && (
          <div className="border-t border-zinc-800 mt-4 animate-message-in">
            <div className="text-center py-3">
              <span className="text-emerald-400 font-bold text-sm">Meeting Completed</span>
            </div>
            {meeting.summary && (
              <div className="mx-4 mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                <h3 className="text-xs font-medium text-zinc-500 uppercase mb-2">Summary</h3>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {meeting.summary}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proposals & votes (DECIDE phase) */}
      {meeting.proposals.length > 0 && (
        <VotePanel
          proposals={meeting.proposals}
          onVote={onVote && meeting.status === "active" ? onVote : undefined}
        />
      )}

      {/* Proposal input */}
      {hasProposals && meeting.status === "active" && onPropose && (
        <div className="border-t border-zinc-800 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = proposalInput.trim();
              if (trimmed) {
                onPropose(trimmed);
                setProposalInput("");
              }
            }}
            className="flex gap-2"
          >
            <input
              value={proposalInput}
              onChange={(e) => setProposalInput(e.target.value)}
              placeholder="Submit a proposal..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!proposalInput.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                proposalInput.trim()
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Propose
            </button>
          </form>
        </div>
      )}

      {/* Action items (ASSIGN phase) */}
      {meeting.actionItems.length > 0 && (
        <ActionItems
          items={meeting.actionItems}
          onAcknowledge={onAcknowledge && meeting.status === "active" ? onAcknowledge : undefined}
        />
      )}

      {/* Assignment input */}
      {hasAssignments && meeting.status === "active" && onAssign && (
        <div className="border-t border-zinc-800 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (taskInput.trim() && assigneeInput) {
                onAssign(taskInput.trim(), assigneeInput, deadlineInput || undefined);
                setTaskInput("");
                setAssigneeInput("");
                setDeadlineInput("");
              }
            }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Task description..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Assign to...</option>
                {(participants ?? meeting.participants).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="date"
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!taskInput.trim() || !assigneeInput}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  taskInput.trim() && assigneeInput
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Relevance check prompt */}
      {meeting.relevanceCheck && onRelevance && (
        <div className="border-t border-zinc-800 p-3 bg-blue-500/5 animate-message-in">
          <div className="text-xs text-zinc-400 mb-2">
            <span className="font-medium text-blue-400">{meeting.relevanceCheck.lastMessage.agentId}</span>
            {" said: \""}
            {meeting.relevanceCheck.lastMessage.content.slice(0, 100)}
            {meeting.relevanceCheck.lastMessage.content.length > 100 ? "..." : ""}
            {'"'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 mr-1">Do you want to respond?</span>
            <button
              onClick={() => onRelevance("must_speak")}
              className="px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Must Speak
            </button>
            <button
              onClick={() => onRelevance("could_add")}
              className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Could Add
            </button>
            <button
              onClick={() => onRelevance("pass")}
              className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {/* Your turn indicator */}
      {meeting.isMyTurn && (
        <div className="border-t border-zinc-800 p-3 bg-amber-500/10 animate-message-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-400">Your turn to speak</span>
            <span className="text-xs text-zinc-500">Type your message below</span>
          </div>
        </div>
      )}

      {/* Phase approval */}
      {meeting.awaitingApproval && onApprove && (
        <div className="border-t border-zinc-800 p-3 bg-violet-500/10 animate-message-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-zinc-300">
                Phase <span className="font-medium text-violet-400">{meeting.awaitingApproval.currentPhase.toUpperCase()}</span>
                {" complete → "}
                <span className="font-medium text-violet-400">{meeting.awaitingApproval.nextPhase.toUpperCase()}</span>
              </span>
            </div>
            <button
              onClick={onApprove}
              className="px-4 py-1.5 rounded text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      )}

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
