import type { Phase } from "../lib/types";

const PHASES: { key: Phase; label: string }[] = [
  { key: "present", label: "PRESENT" },
  { key: "discuss", label: "DISCUSS" },
  { key: "decide", label: "DECIDE" },
  { key: "assign", label: "ASSIGN" },
];

export function PhaseIndicator({ phase, status }: { phase: Phase; status: string }) {
  return (
    <div className="flex items-center gap-1">
      {PHASES.map((p, i) => {
        const isActive = p.key === phase && status === "active";
        const isPast = PHASES.findIndex((x) => x.key === phase) > i;
        const isDone = status === "completed";

        return (
          <div key={p.key} className="flex items-center gap-1">
            {i > 0 && <div className={`w-6 h-0.5 ${isPast || isDone ? "bg-emerald-500" : "bg-zinc-700"}`} />}
            <div
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                isDone
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isActive
                    ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                    : isPast
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {p.label}
            </div>
          </div>
        );
      })}
      {status === "completed" && (
        <span className="ml-2 text-xs text-emerald-400 font-bold">COMPLETED</span>
      )}
    </div>
  );
}
