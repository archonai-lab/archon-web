import type { AgentCard } from "../lib/types";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-emerald-500", label: "Online" },
  offline: { dot: "bg-zinc-600", label: "Offline" },
  busy: { dot: "bg-amber-500", label: "Busy" },
};

export function AgentDetailPanel({
  agent,
  onClose,
}: {
  agent: AgentCard;
  onClose: () => void;
}) {
  const status = STATUS_STYLES[agent.status] ?? STATUS_STYLES.offline;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Agent Details</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-400 shrink-0">
            {agent.id.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{agent.displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${status.dot}`} />
              <span className="text-xs text-zinc-400">{status.label}</span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-500 font-mono">{agent.id}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">
              Description
            </label>
            <p className="text-sm text-zinc-300 leading-relaxed">{agent.description}</p>
          </div>
        )}

        {/* Departments & Roles */}
        {agent.departments && agent.departments.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">
              Departments
            </label>
            <div className="space-y-2">
              {agent.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-200">{dept.name}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {dept.role.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No extra info fallback */}
        {!agent.description && (!agent.departments || agent.departments.length === 0) && (
          <p className="text-sm text-zinc-600 italic">No additional details available.</p>
        )}
      </div>
    </div>
  );
}
