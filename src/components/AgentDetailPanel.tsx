import { useState } from "react";
import type { AgentCard, Department, Role } from "../lib/types";

function getActivityStyle(activity?: string): { dot: string; label: string } {
  if (!activity || activity === "idle") return { dot: "bg-zinc-600", label: "IDLE" };
  if (activity === "spawning") return { dot: "bg-blue-500 animate-pulse", label: "SPAWNING" };
  if (activity.startsWith("in_meeting:")) return { dot: "bg-amber-500", label: activity.replace("in_meeting:", "IN MEETING: ") };
  if (activity === "connected") return { dot: "bg-emerald-500", label: "CONNECTED" };
  return { dot: "bg-zinc-600", label: "IDLE" };
}

export function AgentDetailPanel({
  agent,
  departments,
  roles,
  onClose,
  onUpdate,
  onDelete,
  onReactivate,
}: {
  agent: AgentCard;
  departments: Department[];
  roles: Role[];
  onClose: () => void;
  onUpdate?: (agentId: string, opts: {
    displayName?: string;
    modelConfig?: Record<string, unknown>;
    departments?: Array<{ departmentId: string; roleId: string }>;
  }) => void;
  onDelete?: (agentId: string) => void;
  onReactivate?: (agentId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(agent.displayName);
  const [editingModel, setEditingModel] = useState(false);
  const [editProvider, setEditProvider] = useState(agent.model?.provider ?? "openai");
  const [editModel, setEditModel] = useState(agent.model?.backend ?? "");
  const [editingDepts, setEditingDepts] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<Array<{ departmentId: string; roleId: string }>>(
    agent.departments?.map((d) => ({ departmentId: d.id, roleId: "" })) ?? []
  );
  const status = getActivityStyle(agent.activity);
  const isDeactivated = agent.status === "deactivated";

  const handleSave = () => {
    if (onUpdate && editDisplayName.trim() && editDisplayName.trim() !== agent.displayName) {
      onUpdate(agent.id, { displayName: editDisplayName.trim() });
    }
    setEditing(false);
  };

  const handleModelSave = () => {
    if (!onUpdate) return;
    const modelConfig: Record<string, unknown> = { provider: editProvider };
    if (editModel.trim()) modelConfig.model = editModel.trim();
    onUpdate(agent.id, { modelConfig });
    setEditingModel(false);
  };

  const handleDeptsSave = () => {
    if (!onUpdate) return;
    onUpdate(agent.id, {
      departments: selectedDepts.filter((d) => d.roleId),
    });
    setEditingDepts(false);
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts((prev) => {
      const exists = prev.find((d) => d.departmentId === deptId);
      if (exists) return prev.filter((d) => d.departmentId !== deptId);
      const deptRoles = roles.filter((r) => r.departmentId === deptId);
      return [...prev, { departmentId: deptId, roleId: deptRoles[0]?.id ?? "" }];
    });
  };

  const setDeptRole = (deptId: string, roleId: string) => {
    setSelectedDepts((prev) =>
      prev.map((d) => (d.departmentId === deptId ? { ...d, roleId } : d))
    );
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm(`Are you sure you want to deactivate agent "${agent.displayName}"? This will remove them from all departments and meetings.`)) {
      onDelete(agent.id);
      onClose();
    }
  };

  const handleReactivate = () => {
    if (!onReactivate) return;
    onReactivate(agent.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Agent Details</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Deactivated banner */}
        {isDeactivated && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-red-400">This agent is deactivated</span>
            {onReactivate && (
              <button
                onClick={handleReactivate}
                className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                Reactivate
              </button>
            )}
          </div>
        )}

        {/* Identity */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
            isDeactivated ? "bg-zinc-700 text-zinc-500" : "bg-blue-500/20 text-blue-400"
          }`}>
            {agent.id.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                />
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditDisplayName(agent.displayName); }}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${isDeactivated ? "text-zinc-500" : "text-zinc-100"}`}>
                  {agent.displayName}
                </h3>
                {onUpdate && !isDeactivated && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isDeactivated ? "bg-red-500" : status.dot}`} />
              <span className="text-xs text-zinc-400">{isDeactivated ? "DEACTIVATED" : status.label}</span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-500 font-mono">{agent.id}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">
              Description
            </label>
            <p className="text-sm text-zinc-300 leading-relaxed">{agent.description}</p>
          </div>
        )}

        {/* Departments & Roles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">
              Departments
            </label>
            {onUpdate && !isDeactivated && !editingDepts && (
              <button
                onClick={() => {
                  // Init selected from current agent departments
                  setSelectedDepts(
                    agent.departments?.map((d) => ({
                      departmentId: d.id,
                      // Find the role ID from the roles list
                      roleId: roles.find((r) => r.departmentId === d.id && r.name === d.role.name)?.id ?? "",
                    })) ?? []
                  );
                  setEditingDepts(true);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Edit
              </button>
            )}
          </div>
          {editingDepts ? (
            <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
              {departments.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No departments available</p>
              ) : (
                departments.map((dept) => {
                  const isSelected = selectedDepts.some((d) => d.departmentId === dept.id);
                  const deptRoles = roles.filter((r) => r.departmentId === dept.id);
                  const selectedRole = selectedDepts.find((d) => d.departmentId === dept.id)?.roleId;

                  return (
                    <div key={dept.id} className="bg-zinc-800 rounded px-3 py-2">
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
                          className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                        >
                          <option value="">Select role...</option>
                          {deptRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDeptsSave}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDepts(false)}
                  className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : agent.departments && agent.departments.length > 0 ? (
            <div className="space-y-2">
              {agent.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-200">{dept.name}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {dept.role.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 italic">No departments assigned</p>
          )}
        </div>

        {/* LLM Configuration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">
              LLM Configuration
            </label>
            {onUpdate && !isDeactivated && !editingModel && (
              <button
                onClick={() => setEditingModel(true)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Edit
              </button>
            )}
          </div>
          {editingModel ? (
            <div className="bg-zinc-900 rounded-lg p-3 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Provider</label>
                <select
                  value={editProvider}
                  onChange={(e) => setEditProvider(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI / OpenRouter</option>
                  <option value="cli-claude">Claude CLI</option>
                  <option value="cli-gemini">Gemini CLI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Model</label>
                <input
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  placeholder={editProvider === "openai" ? "anthropic/claude-sonnet-4" : editProvider === "cli-claude" ? "haiku" : "gemini-2.5-flash"}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleModelSave}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingModel(false);
                    setEditProvider(agent.model?.provider ?? "openai");
                    setEditModel(agent.model?.backend ?? "");
                  }}
                  className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-sm text-zinc-200">
                  {agent.model?.provider ?? "openai"}
                </span>
                {agent.model?.backend && agent.model.backend !== "unknown" && (
                  <span className="text-xs text-zinc-500 ml-2 font-mono">
                    {agent.model.backend}
                  </span>
                )}
              </div>
              {!agent.model && (
                <span className="text-xs text-zinc-600 italic">Not configured</span>
              )}
            </div>
          )}
        </div>

        {/* Delete / Reactivate */}
        {(onDelete || onReactivate) && (
          <div className="pt-4 border-t border-zinc-800">
            {isDeactivated && onReactivate ? (
              <>
                <button
                  onClick={handleReactivate}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                >
                  Reactivate Agent
                </button>
                <p className="text-xs text-zinc-600 mt-1">
                  Restores agent to active status. You may need to re-assign departments.
                </p>
              </>
            ) : onDelete && !isDeactivated ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                >
                  Deactivate Agent
                </button>
                <p className="text-xs text-zinc-600 mt-1">
                  Removes agent from all departments and meetings. Can be reactivated later.
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
