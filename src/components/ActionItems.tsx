import type { ActionItem } from "../lib/types";

export function ActionItems({
  items,
  onAcknowledge,
}: {
  items: ActionItem[];
  onAcknowledge?: (taskIndex: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-zinc-800 p-4 space-y-2">
      <h3 className="text-xs font-medium text-zinc-500 uppercase">Action Items</h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.taskIndex}
            className="flex items-start gap-3 bg-zinc-900 rounded-lg px-3 py-2"
          >
            <div className="w-5 h-5 rounded border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs text-zinc-500">{item.taskIndex + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200">{item.task}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <span>
                  <span className="text-zinc-400">{item.assigneeId}</span>
                  {" "}assigned by {item.assignedBy}
                </span>
                {item.deadline && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="text-amber-400">{item.deadline}</span>
                  </>
                )}
                {onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(item.taskIndex)}
                    className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
