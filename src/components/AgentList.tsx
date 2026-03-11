import type { AgentCard } from "../lib/types";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-zinc-600",
  busy: "bg-amber-500",
};

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
          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[agent.status] ?? "bg-zinc-600"}`} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-zinc-200 truncate">
              {agent.displayName}
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {agent.departments?.[0]?.name ?? "—"} · {agent.status}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
