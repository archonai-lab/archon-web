import { useState } from "react";
import type { Role, Department } from "../lib/types";

export function RoleManager({
  roles,
  departments,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  roles: Role[];
  departments: Department[];
  onCreate: (departmentId: string, name: string) => void;
  onUpdate: (roleId: string, opts: { name?: string }) => void;
  onDelete: (roleId: string) => void;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const getDeptName = (deptId: string) => departments.find((d) => d.id === deptId)?.name ?? deptId;

  const handleCreate = () => {
    if (!newName.trim() || !newDeptId) return;
    onCreate(newDeptId, newName.trim());
    setNewName("");
    setShowForm(false);
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = (role: Role) => {
    if (window.confirm(`Delete role "${role.name}"? Agents with this role will be removed from the department.`)) {
      onDelete(role.id);
    }
  };

  // Group roles by department
  const grouped = new Map<string, Role[]>();
  for (const role of roles) {
    const group = grouped.get(role.departmentId) ?? [];
    group.push(role);
    grouped.set(role.departmentId, group);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Roles</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + New
          </button>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">
            &times;
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {showForm && (
          <div className="bg-zinc-900 rounded-lg p-4 space-y-3 border border-zinc-800">
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Role name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newDeptId}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  newName.trim() && newDeptId
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                Create
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {grouped.size === 0 && !showForm && (
          <p className="text-sm text-zinc-600 text-center py-8">No roles yet. Create a department first, then add roles.</p>
        )}

        {[...grouped.entries()].map(([deptId, deptRoles]) => (
          <div key={deptId}>
            <h3 className="text-xs font-medium text-zinc-500 uppercase mb-2">{getDeptName(deptId)}</h3>
            <div className="space-y-1.5">
              {deptRoles.map((role) => (
                <div key={role.id} className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between">
                  {editingId === role.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); if (e.key === "Escape") setEditingId(null); }}
                      />
                      <button onClick={handleUpdate} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-zinc-400">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-zinc-200">{role.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingId(role.id); setEditName(role.name); }}
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(role)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
