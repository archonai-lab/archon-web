import type { Proposal, VoteChoice } from "../lib/types";

const VOTE_STYLES: Record<VoteChoice, { bg: string; text: string; label: string }> = {
  approve: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Approve" },
  reject: { bg: "bg-red-500/20", text: "text-red-400", label: "Reject" },
  abstain: { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "Abstain" },
};

export function VotePanel({ proposals }: { proposals: Proposal[] }) {
  if (proposals.length === 0) return null;

  return (
    <div className="border-t border-zinc-800 p-4 space-y-3">
      <h3 className="text-xs font-medium text-zinc-500 uppercase">Proposals</h3>
      {proposals.map((p, i) => {
        const approves = p.votes.filter((v) => v.vote === "approve").length;
        const rejects = p.votes.filter((v) => v.vote === "reject").length;
        const abstains = p.votes.filter((v) => v.vote === "abstain").length;
        const total = p.votes.length;

        return (
          <div key={i} className="bg-zinc-900 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-zinc-200 leading-relaxed">{p.proposal}</p>
              <span className="text-xs text-zinc-500 shrink-0">by {p.agentId}</span>
            </div>

            {/* Vote bar */}
            {total > 0 && (
              <div className="space-y-1.5">
                <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
                  {approves > 0 && (
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(approves / total) * 100}%` }}
                    />
                  )}
                  {rejects > 0 && (
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(rejects / total) * 100}%` }}
                    />
                  )}
                  {abstains > 0 && (
                    <div
                      className="bg-zinc-500 transition-all"
                      style={{ width: `${(abstains / total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-400">{approves} approve</span>
                  <span className="text-red-400">{rejects} reject</span>
                  <span className="text-zinc-400">{abstains} abstain</span>
                </div>
              </div>
            )}

            {/* Individual votes */}
            {p.votes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.votes.map((v, vi) => {
                  const s = VOTE_STYLES[v.vote];
                  return (
                    <span
                      key={vi}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${s.bg} ${s.text}`}
                      title={v.reason || undefined}
                    >
                      {v.agentId}: {s.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
