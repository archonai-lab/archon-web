import { useState } from "react";
import type { Department, AgentCard } from "../lib/types";

export function DepartmentManager({
  departments,
  agents,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  departments: Department[];
  agents: AgentCard[];
  onCreate: (name: string, description?: string) => void;
  onUpdate: (departmentId: string, opts: { name?: string; description?: string }) => void;
  onDelete: (departmentId: string) => void;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const getMemberCount = (deptId: string) =>
    agents.filter((a) => a.departments?.some((d) => d.id === deptId)).length;

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    setShowForm(false);
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description ?? "");
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, { name: editName.trim(), description: editDesc.trim() || undefined });
    setEditingId(null);
  };

  const handleDelete = (dept: Department) => {
    if (window.confirm(`Delete department "${dept.name}"? This will remove all agent assignments in this department.`)) {
      onDelete(dept.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Departments</h2>
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
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Department name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  newName.trim()
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {departments.length === 0 && !showForm && (
          <p className="text-sm text-zinc-600 text-center py-8">No departments yet. Create one to get started.</p>
        )}

        {departments.map((dept) => (
          <div key={dept.id} className="bg-zinc-900 rounded-lg p-4 space-y-2">
            {editingId === dept.id ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdate} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded">Save</button>
                  <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                      {getMemberCount(dept.id)} members
                    </span>
                    <button onClick={() => startEdit(dept)} className="text-xs text-zinc-500 hover:text-zinc-300">Edit</button>
                    <button onClick={() => handleDelete(dept)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
