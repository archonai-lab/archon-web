import { useState, useEffect } from "react";
import type { HubConfig } from "../lib/types";

export function HubSettings({
  config,
  onSet,
  onClose,
}: {
  config: HubConfig | null;
  onSet: (key: string, value: unknown) => void;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!config) return;
    setApiKey("");
    setBaseUrl(config.llmBaseUrl);
    setModel(config.llmModel);
    setDirty(false);
  }, [config]);

  const handleSave = () => {
    if (apiKey) onSet("llmApiKey", apiKey);
    if (baseUrl) onSet("llmBaseUrl", baseUrl);
    if (model) onSet("llmModel", model);
    setDirty(false);
  };

  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading config...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-zinc-100">Hub Settings</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-sm"
        >
          &times; Close
        </button>
      </div>

      <div className="max-w-lg space-y-6">
        {/* LLM status */}
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${config.llmAvailable ? "bg-emerald-500" : "bg-zinc-600"}`} />
          <span className="text-sm text-zinc-300">
            {config.llmAvailable ? "LLM summary available" : "LLM summary not configured"}
          </span>
        </div>

        <p className="text-xs text-zinc-500">
          Configure LLM credentials here to enable AI-powered meeting summaries.
          When creating a meeting, you can choose between no summary, structured, or AI summary.
        </p>

        {/* LLM config */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setDirty(true); }}
              placeholder={config.llmApiKey ? `Current: ${config.llmApiKey}` : "Enter API key..."}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Base URL</label>
            <input
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setDirty(true); }}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Model</label>
            <input
              value={model}
              onChange={(e) => { setModel(e.target.value); setDirty(true); }}
              placeholder="anthropic/claude-sonnet-4"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {dirty && (
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
}
