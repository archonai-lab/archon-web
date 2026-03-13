import { useCallback, useEffect, useState } from "react";
import type { MeetingSummary } from "../lib/types";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-blue-500/20", text: "text-blue-400" },
  completed: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400" },
};

export function MeetingHistory({
  meetings,
  onLoadMore,
  onViewTranscript,
  onClose,
  statusFilter,
  onFilterChange,
}: {
  meetings: MeetingSummary[];
  onLoadMore: (cursor?: string) => void;
  onViewTranscript: (meetingId: string) => void;
  onClose: () => void;
  statusFilter: string;
  onFilterChange: (status: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      onLoadMore();
      setLoaded(true);
    }
  }, [loaded, onLoadMore]);

  const handleLoadMore = useCallback(() => {
    const last = meetings[meetings.length - 1];
    if (last) onLoadMore(last.id);
  }, [meetings, onLoadMore]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Meeting History</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">
          &times;
        </button>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b border-zinc-800 flex gap-2">
        {["all", "active", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              statusFilter === f
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {meetings.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">No meetings found.</p>
        )}

        {meetings.map((m) => {
          const s = STATUS_STYLES[m.status] ?? STATUS_STYLES.active;
          return (
            <button
              key={m.id}
              onClick={() => onViewTranscript(m.id)}
              className="w-full text-left bg-zinc-900 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">{m.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
                  {m.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{m.participantCount} participants</span>
                <span>{m.messageCount} messages</span>
                <span>{m.tokensUsed.toLocaleString()} tokens</span>
                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-zinc-600">
                {m.methodology} · initiated by {m.initiatorId}
              </div>
            </button>
          );
        })}

        {meetings.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Load more...
          </button>
        )}
      </div>
    </div>
  );
}
