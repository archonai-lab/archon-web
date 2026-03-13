import { useState } from "react";
import type { AgentCard } from "../lib/types";
import { AgentList } from "./AgentList";

type SummaryMode = "off" | "structured" | "llm";

export function MeetingLauncher({
  agents,
  onStart,
  llmAvailable,
}: {
  agents: AgentCard[];
  onStart: (title: string, invitees: string[], agenda: string, methodology?: string, summaryMode?: SummaryMode) => void;
  llmAvailable?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [methodology, setMethodology] = useState("");
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("off");
  const [selected, setSelected] = useState(new Set<string>());

  const toggleAgent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canStart = title.trim() && selected.size > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-100">New Meeting</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Architecture Review"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Agenda</label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="What should we discuss?"
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Methodology
            <span className="text-zinc-600 font-normal ml-1">(optional)</span>
          </label>
          <input
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            placeholder="general (default)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Name of a methodology file in ~/.archon/methodologies/ (e.g. standup, retrospective)
          </p>
        </div>

        {/* Summary mode */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Post-Meeting Summary
          </label>
          <div className="flex gap-2">
            {(["off", "structured", "llm"] as const).map((opt) => {
              const disabled = opt === "llm" && !llmAvailable;
              return (
                <button
                  key={opt}
                  onClick={() => !disabled && setSummaryMode(opt)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    summaryMode === opt
                      ? "bg-blue-600 text-white"
                      : disabled
                      ? "bg-zinc-800/50 text-zinc-700 cursor-not-allowed"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {opt === "off" ? "None" : opt === "structured" ? "Structured" : "AI Summary"}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {summaryMode === "off" && "No summary will be generated."}
            {summaryMode === "structured" && "Markdown summary extracted from meeting data."}
            {summaryMode === "llm" && (llmAvailable
              ? "AI-powered natural language summary after meeting ends."
              : "Configure LLM API key in Settings first.")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Invite Agents ({selected.size} selected)
          </label>
          <AgentList agents={agents} selected={selected} onSelect={toggleAgent} />
        </div>
      </div>

      <div className="p-6 border-t border-zinc-800">
        <button
          onClick={() => {
            if (canStart) {
              onStart(
                title.trim(),
                [...selected],
                agenda.trim(),
                methodology.trim() || undefined,
                summaryMode,
              );
              setTitle("");
              setAgenda("");
              setMethodology("");
              setSummaryMode("off");
              setSelected(new Set());
            }
          }}
          disabled={!canStart}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            canStart
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          Start Meeting
        </button>
      </div>
    </div>
  );
}
