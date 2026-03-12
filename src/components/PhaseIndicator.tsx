import { DEFAULT_PHASES } from "../lib/types";

/**
 * Visual phase progress bar.
 *
 * Dynamically renders whatever phases the meeting uses.
 * Falls back to the default 4-phase order if no phases have been observed yet.
 */
export function PhaseIndicator({
  phase,
  status,
  phases,
}: {
  phase: string;
  status: string;
  /** Ordered phase names from the meeting (populated as phase_change messages arrive). */
  phases?: string[];
}) {
  // Use observed phases if available, otherwise fall back to defaults
  const phaseList = phases && phases.length > 0 ? phases : DEFAULT_PHASES;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {phaseList.map((p, i) => {
        const isActive = p === phase && status === "active";
        const isPast = phaseList.indexOf(phase) > i;
        const isDone = status === "completed";

        return (
          <div key={p} className="flex items-center gap-1">
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
              {p.toUpperCase()}
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
