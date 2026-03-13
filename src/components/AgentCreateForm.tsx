import { useState } from "react";
import type { AgentCard, Department, Role } from "../lib/types";

export function AgentCreateForm({
  agents,
  departments,
  roles,
  onSubmit,
  onCancel,
}: {
  agents: AgentCard[];
  departments: Department[];
  roles: Role[];
  onSubmit: (name: string, displayName: string, opts?: {
    departments?: Array<{ departmentId: string; roleId: string }>;
    role?: string;
    modelConfig?: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<Array<{ departmentId: string; roleId: string }>>([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const nameExists = agents.some((a) => a.id === name);
  const nameValid = /^[a-z0-9_-]+$/.test(name) && name.length > 0;
  const canSubmit = nameValid && !nameExists && displayName.trim().length > 0;

  const toggleDept = (deptId: string) => {
    setSelectedDepts((prev) => {
      const exists = prev.find((d) => d.departmentId === deptId);
      if (exists) return prev.filter((d) => d.departmentId !== deptId);
      // Pick first role in this department, or empty
      const deptRoles = roles.filter((r) => r.departmentId === deptId);
      return [...prev, { departmentId: deptId, roleId: deptRoles[0]?.id ?? "" }];
    });
  };

  const setDeptRole = (deptId: string, roleId: string) => {
    setSelectedDepts((prev) =>
      prev.map((d) => (d.departmentId === deptId ? { ...d, roleId } : d))
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError("");
    const modelConfig: Record<string, unknown> = { provider };
    if (model.trim()) modelConfig.model = model.trim();
    if (baseUrl.trim()) modelConfig.baseUrl = baseUrl.trim();
    if (apiKey.trim()) modelConfig.apiKey = apiKey.trim();

    onSubmit(
      name,
      displayName.trim(),
      {
        departments: selectedDepts.length > 0 ? selectedDepts.filter((d) => d.roleId) : undefined,
        role: role.trim() || undefined,
        modelConfig,
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Create Agent</h2>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Agent ID</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="my-agent"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          {name && !nameValid && (
            <p className="text-xs text-red-400 mt-1">Must be lowercase alphanumeric with hyphens/underscores</p>
          )}
          {nameExists && (
            <p className="text-xs text-red-400 mt-1">Agent &quot;{name}&quot; already exists</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My Agent"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Role Description
            <span className="text-zinc-600 font-normal ml-1">(optional)</span>
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Senior Engineer, Product Manager, etc."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* LLM Configuration */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">LLM Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="openai">OpenAI / OpenRouter</option>
            <option value="cli-claude">Claude CLI</option>
            <option value="cli-gemini">Gemini CLI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Model
            <span className="text-zinc-600 font-normal ml-1">(optional)</span>
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={provider === "openai" ? "anthropic/claude-sonnet-4, gpt-4o, etc." : provider === "cli-claude" ? "haiku, sonnet, etc." : "gemini-pro, etc."}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        {provider === "openai" && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Base URL
                <span className="text-zinc-600 font-normal ml-1">(optional, defaults to OpenRouter)</span>
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                API Key
                <span className="text-zinc-600 font-normal ml-1">(optional, uses env vars if empty)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </>
        )}

        {departments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Departments
              <span className="text-zinc-600 font-normal ml-1">(optional)</span>
            </label>
            <div className="space-y-2">
              {departments.map((dept) => {
                const isSelected = selectedDepts.some((d) => d.departmentId === dept.id);
                const deptRoles = roles.filter((r) => r.departmentId === dept.id);
                const selectedRole = selectedDepts.find((d) => d.departmentId === dept.id)?.roleId;

                return (
                  <div key={dept.id} className="bg-zinc-900 rounded-lg px-3 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDept(dept.id)}
                        className="rounded border-zinc-600"
                      />
                      <span className="text-sm text-zinc-200">{dept.name}</span>
                    </label>
                    {isSelected && deptRoles.length > 0 && (
                      <select
                        value={selectedRole}
                        onChange={(e) => setDeptRole(dept.id, e.target.value)}
                        className="mt-2 w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                      >
                        <option value="">Select role...</option>
                        {deptRoles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          Create Agent
        </button>
      </div>
    </div>
  );
}
