import { useState } from "react";

export function ConnectionSettings({
  currentAgentId,
  currentUrl,
  onConnect,
}: {
  currentAgentId: string;
  currentUrl: string;
  onConnect: (agentId: string, url: string) => void;
}) {
  const [agentId, setAgentId] = useState(currentAgentId);
  const [url, setUrl] = useState(currentUrl);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-zinc-100">Connect to Hub</h2>
          <p className="text-sm text-zinc-500">Choose your identity and hub address</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Agent ID</label>
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="ceo"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-zinc-600 mt-1">
            Connect as "ceo" to initiate meetings, or use a custom ID to observe.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Hub URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://localhost:9500"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <button
          onClick={() => {
            const id = agentId.trim() || "ceo";
            const u = url.trim() || "ws://localhost:9500";
            onConnect(id, u);
          }}
          className="w-full py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Connect
        </button>
      </div>
    </div>
  );
}
