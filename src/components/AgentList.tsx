import type { AgentCard } from "../lib/types";

function activityDot(activity?: string): string {
  if (!activity || activity === "idle") return "bg-zinc-600";
  if (activity === "spawning") return "bg-blue-500 animate-pulse";
  if (activity.startsWith("in_meeting:")) return "bg-amber-500";
  if (activity === "connected") return "bg-emerald-500";
  return "bg-zinc-600";
}

function activityLabel(activity?: string): string {
  if (!activity || activity === "idle") return "Idle";
  if (activity === "spawning") return "Spawning...";
  if (activity.startsWith("in_meeting:")) return activity.replace("in_meeting:", "In meeting: ");
  if (activity === "connected") return "Connected";
  return "Idle";
}

export function AgentList({
  agents,
  selected,
  onSelect,
}: {
  agents: AgentCard[];
  selected: Set<string>;
  onSelect: (id: string) => void;
}) {
  if (agents.length === 0) {
    return <p className="text-zinc-500 text-sm px-3">No agents found</p>;
  }

  return (
    <div className="space-y-1">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onSelect(agent.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
            selected.has(agent.id)
              ? "bg-blue-500/20 ring-1 ring-blue-500/40"
              : "hover:bg-zinc-800"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${activityDot(agent.activity)}`} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-zinc-200 truncate">
              {agent.displayName}
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {agent.departments?.[0]?.name ?? "—"} · {activityLabel(agent.activity)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
