"use client";

import { useState } from "react";
import type { Page, PageGroup } from "@prisma/client";

type GroupWithPages = PageGroup & { pages: Page[] };

export default function PageGroupsClient({
  profileId,
  initialGroups,
}: {
  profileId: string;
  initialGroups: GroupWithPages[];
}) {
  const [groups, setGroups] = useState<GroupWithPages[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [error, setError] = useState("");

  // Per-group "add page" form state
  const [addingPageFor, setAddingPageFor] = useState<string | null>(null);
  const [newPath, setNewPath] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Per-page edit state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPath, setEditPath] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const totalPages = groups.reduce((s, g) => s + g.pages.length, 0);

  // ── Groups ──────────────────────────────────────────────────────────────

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    setError("");

    const res = await fetch(`/api/profiles/${profileId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });

    if (res.ok) {
      const group: GroupWithPages = await res.json();
      setGroups((prev) => [...prev, group]);
      setNewGroupName("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create group.");
    }
    setAddingGroup(false);
  }

  async function saveGroupName(groupId: string) {
    if (!editingGroupName.trim()) return;
    const res = await fetch(`/api/profiles/${profileId}/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingGroupName.trim() }),
    });
    if (res.ok) {
      const updated: GroupWithPages = await res.json();
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
    }
    setEditingGroupId(null);
  }

  async function deleteGroup(groupId: string, pageCount: number) {
    const msg =
      pageCount > 0
        ? `Delete this group and its ${pageCount} page${pageCount !== 1 ? "s" : ""}?`
        : "Delete this group?";
    if (!confirm(msg)) return;

    const res = await fetch(`/api/profiles/${profileId}/groups/${groupId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  }

  // ── Pages ───────────────────────────────────────────────────────────────

  async function addPage(e: React.FormEvent, groupId: string) {
    e.preventDefault();
    if (!newPath.trim()) return;
    setError("");

    const res = await fetch(
      `/api/profiles/${profileId}/groups/${groupId}/pages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newPath.trim(), label: newLabel.trim() }),
      }
    );

    if (res.ok) {
      const page: Page = await res.json();
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, pages: [...g.pages, page] } : g
        )
      );
      setNewPath("");
      setNewLabel("");
      setAddingPageFor(null);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to add page.");
    }
  }

  function startEditPage(page: Page) {
    setEditingPageId(page.id);
    setEditPath(page.path);
    setEditLabel(page.label ?? "");
  }

  async function savePage(groupId: string, pageId: string) {
    const res = await fetch(
      `/api/profiles/${profileId}/groups/${groupId}/pages/${pageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: editPath, label: editLabel }),
      }
    );
    if (res.ok) {
      const updated: Page = await res.json();
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, pages: g.pages.map((p) => (p.id === pageId ? updated : p)) }
            : g
        )
      );
    }
    setEditingPageId(null);
  }

  async function deletePage(groupId: string, pageId: string) {
    if (!confirm("Remove this page?")) return;
    const res = await fetch(
      `/api/profiles/${profileId}/groups/${groupId}/pages/${pageId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, pages: g.pages.filter((p) => p.id !== pageId) }
            : g
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Add group form */}
      <form onSubmit={createGroup} className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name (e.g. Categories)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={addingGroup || !newGroupName.trim()}
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          + Add group
        </button>
      </form>

      {groups.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-1">No groups yet</p>
          <p className="text-sm text-gray-400">
            Create a group (e.g. &quot;Categories&quot;) then add page paths to it.
          </p>
        </div>
      )}

      {totalPages > 0 && (
        <p className="text-xs text-gray-400">
          {totalPages} page{totalPages !== 1 ? "s" : ""} across {groups.length} group{groups.length !== 1 ? "s" : ""} — all will be checked on next analysis run
        </p>
      )}

      {/* Groups */}
      {groups.map((group) => (
        <div
          key={group.id}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* Group header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
            {editingGroupId === group.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); saveGroupName(group.id); }}
                className="flex gap-2 flex-1"
              >
                <input
                  autoFocus
                  type="text"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGroupId(null)}
                  className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="font-semibold text-gray-900 flex-1">{group.name}</span>
                <span className="text-xs text-gray-400">
                  {group.pages.length} page{group.pages.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => {
                    setEditingGroupId(group.id);
                    setEditingGroupName(group.name);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteGroup(group.id, group.pages.length)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Pages list */}
          {group.pages.length > 0 && (
            <div className="divide-y divide-gray-100">
              {group.pages.map((page) => (
                <div key={page.id} className="px-5 py-3">
                  {editingPageId === page.id ? (
                    <div className="flex gap-2 flex-wrap">
                      <input
                        autoFocus
                        type="text"
                        value={editPath}
                        onChange={(e) => setEditPath(e.target.value)}
                        placeholder="Path"
                        className="w-40 px-2 py-1 text-sm border border-gray-300 rounded font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label (optional)"
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => savePage(group.id, page.id)}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPageId(null)}
                        className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        {page.path}
                      </code>
                      {page.label && (
                        <span className="text-sm text-gray-600">{page.label}</span>
                      )}
                      <div className="ml-auto flex gap-3">
                        <button
                          onClick={() => startEditPage(page)}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePage(group.id, page.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add page form */}
          {addingPageFor === group.id ? (
            <form
              onSubmit={(e) => addPage(e, group.id)}
              className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2 flex-wrap"
            >
              <input
                autoFocus
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="/path/to/page"
                required
                className="w-44 px-2 py-1.5 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddingPageFor(null); setNewPath(""); setNewLabel(""); }}
                className="px-3 py-1.5 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => { setAddingPageFor(group.id); setNewPath(""); setNewLabel(""); }}
              className="w-full px-5 py-3 text-left text-sm text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border-t border-gray-100"
            >
              + Add page to {group.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
