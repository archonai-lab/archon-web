import { useState } from "react";

type ConnectionMode = "human" | "agent";

export function ConnectionSettings({
  currentAgentId,
  currentUrl,
  onConnect,
}: {
  currentAgentId: string;
  currentUrl: string;
  onConnect: (agentId: string, url: string) => void;
}) {
  const [mode, setMode] = useState<ConnectionMode>("human");
  const [agentId, setAgentId] = useState(currentAgentId === "ceo" ? "" : currentAgentId);
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState(currentUrl);

  const handleConnect = () => {
    const u = url.trim() || "ws://localhost:9500";
    if (mode === "human") {
      const id = username.trim();
      if (!id) return;
      onConnect(id, u);
    } else {
      const id = agentId.trim();
      if (!id) return;
      onConnect(id, u);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-zinc-100">Connect to Hub</h2>
          <p className="text-sm text-zinc-500">Join as a human participant or connect as an agent</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg bg-zinc-800 p-1">
          <button
            onClick={() => setMode("human")}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "human"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Human
          </button>
          <button
            onClick={() => setMode("agent")}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "agent"
                ? "bg-zinc-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Agent
          </button>
        </div>

        {mode === "human" ? (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="levia"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-zinc-600 mt-1">
              Connect as yourself to observe and participate in meetings.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Agent ID</label>
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="ceo"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-zinc-600 mt-1">
              Connect as an AI agent. Use "ceo" to initiate meetings.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Hub URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://localhost:9500"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <button
          onClick={handleConnect}
          className="w-full py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {mode === "human" ? "Join as Human" : "Connect as Agent"}
        </button>
      </div>
    </div>
  );
}
