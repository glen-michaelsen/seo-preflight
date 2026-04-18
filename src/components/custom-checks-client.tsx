"use client";

import { useState } from "react";
import type { CustomCheck, PageGroup } from "@prisma/client";

type CheckType =
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "REGEX"
  | "SELECTOR_EXISTS"
  | "META_TAG";

type CheckWithGroups = CustomCheck & { groups: { groupId: string }[] };

const TYPE_LABELS: Record<CheckType, string> = {
  CONTAINS: "HTML contains",
  NOT_CONTAINS: "HTML does not contain",
  REGEX: "Regex match",
  SELECTOR_EXISTS: "CSS selector exists",
  META_TAG: "Meta tag value",
};

const TYPE_DESCRIPTIONS: Record<CheckType, string> = {
  CONTAINS: 'Passes if the HTML source includes the specified string. E.g. "GTM-XXXXXX"',
  NOT_CONTAINS: "Passes if the HTML source does NOT include the specified string.",
  REGEX: "Passes if the HTML source matches the regular expression.",
  SELECTOR_EXISTS: "Passes if the CSS selector matches at least one element.",
  META_TAG: 'Passes if a <meta name="..."> tag has the expected content.',
};

function defaultConfig(type: CheckType): object {
  switch (type) {
    case "CONTAINS":
    case "NOT_CONTAINS":
      return { value: "" };
    case "REGEX":
      return { pattern: "", flags: "i" };
    case "SELECTOR_EXISTS":
      return { selector: "" };
    case "META_TAG":
      return { name: "", content: "" };
  }
}

export default function CustomChecksClient({
  profileId,
  initialChecks,
  availableGroups,
}: {
  profileId: string;
  initialChecks: CheckWithGroups[];
  availableGroups: PageGroup[];
}) {
  const [checks, setChecks] = useState<CheckWithGroups[]>(initialChecks);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CheckWithGroups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CheckType>("CONTAINS");
  const [configState, setConfigState] = useState<Record<string, string>>(
    defaultConfig("CONTAINS") as Record<string, string>
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  function openNew() {
    setEditing(null);
    setName("");
    setDescription("");
    setType("CONTAINS");
    setConfigState(defaultConfig("CONTAINS") as Record<string, string>);
    setSelectedGroupIds([]);
    setError("");
    setShowForm(true);
  }

  function openEdit(check: CheckWithGroups) {
    setEditing(check);
    setName(check.name);
    setDescription(check.description ?? "");
    setType(check.type as CheckType);
    setConfigState(JSON.parse(check.config));
    setSelectedGroupIds(check.groups.map((g) => g.groupId));
    setError("");
    setShowForm(true);
  }

  function handleTypeChange(newType: CheckType) {
    setType(newType);
    setConfigState(defaultConfig(newType) as Record<string, string>);
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = { name, description, type, config: configState };
    const url = editing
      ? `/api/profiles/${profileId}/checks/${editing.id}`
      : `/api/profiles/${profileId}/checks`;

    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save check.");
      setLoading(false);
      return;
    }

    const saved: CheckWithGroups = await res.json();

    // Save group assignments
    await fetch(`/api/profiles/${profileId}/checks/${saved.id}/groups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupIds: selectedGroupIds }),
    });

    const withGroups: CheckWithGroups = {
      ...saved,
      groups: selectedGroupIds.map((groupId) => ({ groupId })),
    };

    setChecks((prev) =>
      editing
        ? prev.map((c) => (c.id === withGroups.id ? withGroups : c))
        : [...prev, withGroups]
    );
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this check?")) return;
    await fetch(`/api/profiles/${profileId}/checks/${id}`, { method: "DELETE" });
    setChecks((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleEnabled(check: CheckWithGroups) {
    const res = await fetch(`/api/profiles/${profileId}/checks/${check.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !check.enabled }),
    });
    if (res.ok) {
      const updated: CheckWithGroups = await res.json();
      setChecks((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  }

  const groupMap = Object.fromEntries(availableGroups.map((g) => [g.id, g.name]));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">
          {checks.length} check{checks.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-gtc-green text-white text-sm font-semibold rounded-lg hover:bg-gtc-green-dark transition-colors"
        >
          + Add check
        </button>
      </div>

      {checks.length === 0 && !showForm && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-1">No custom checks yet</p>
          <p className="text-sm text-gray-400">
            Add a check to verify things like GTM IDs, tracking pixels, or any HTML pattern.
          </p>
        </div>
      )}

      {checks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-6">
          {checks.map((check) => (
            <div key={check.id} className="px-5 py-4 flex items-start gap-4">
              <button
                onClick={() => toggleEnabled(check)}
                className={`mt-0.5 w-8 h-5 rounded-full transition-colors relative shrink-0 ${
                  check.enabled ? "bg-green-500" : "bg-gray-300"
                }`}
                title={check.enabled ? "Enabled" : "Disabled"}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    check.enabled ? "translate-x-3" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{check.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {TYPE_LABELS[check.type as CheckType]} ·{" "}
                  <span className="font-mono">{check.config.slice(0, 50)}</span>
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {check.groups.length === 0 ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      All pages
                    </span>
                  ) : (
                    check.groups.map((g) => (
                      <span
                        key={g.groupId}
                        className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700"
                      >
                        {groupMap[g.groupId] ?? g.groupId}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <button
                onClick={() => openEdit(check)}
                className="text-sm text-gray-500 hover:text-gray-800 shrink-0"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(check.id)}
                className="text-sm text-red-400 hover:text-red-600 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editing ? "Edit check" : "New custom check"}
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gtc-green"
                  placeholder="GTM tag present"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check type
                </label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as CheckType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gtc-green bg-white"
                >
                  {(Object.keys(TYPE_LABELS) as CheckType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gtc-green"
                placeholder="Why this check matters"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <p className="text-xs text-gray-500">{TYPE_DESCRIPTIONS[type]}</p>
              <ConfigFields
                type={type}
                config={configState}
                onChange={(key, val) =>
                  setConfigState((prev) => ({ ...prev, [key]: val }))
                }
              />
            </div>

            {/* Group scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply to groups
              </label>
              {availableGroups.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No groups defined yet — this check will run on all pages.{" "}
                  <a href={`/profiles/${profileId}/pages`} className="text-gtc-green hover:underline">
                    Add groups
                  </a>
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    Leave all unchecked to run on every page. Select specific groups to scope this check.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableGroups.map((group) => {
                      const selected = selectedGroupIds.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            selected
                              ? "bg-gtc-green text-white border-gtc-green"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gtc-green/50"
                          }`}
                        >
                          {group.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedGroupIds.length === 0 && (
                    <p className="text-xs text-gtc-green">→ Will run on all pages</p>
                  )}
                  {selectedGroupIds.length > 0 && (
                    <p className="text-xs text-gtc-green">
                      → Will run only on pages in:{" "}
                      {selectedGroupIds.map((id) => groupMap[id]).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gtc-green text-white font-semibold rounded-lg hover:bg-gtc-green-dark disabled:opacity-60 transition-colors"
              >
                {loading ? "Saving…" : editing ? "Save changes" : "Add check"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ConfigFields({
  type,
  config,
  onChange,
}: {
  type: CheckType;
  config: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  switch (type) {
    case "CONTAINS":
    case "NOT_CONTAINS":
      return (
        <Field
          label="String to search for"
          value={config.value ?? ""}
          onChange={(v) => onChange("value", v)}
          placeholder="GTM-XXXXXX"
        />
      );
    case "REGEX":
      return (
        <>
          <Field
            label="Pattern"
            value={config.pattern ?? ""}
            onChange={(v) => onChange("pattern", v)}
            placeholder="UA-\d{4,9}-\d{1,2}"
            mono
          />
          <Field
            label="Flags (optional)"
            value={config.flags ?? "i"}
            onChange={(v) => onChange("flags", v)}
            placeholder="i"
            mono
          />
        </>
      );
    case "SELECTOR_EXISTS":
      return (
        <Field
          label="CSS selector"
          value={config.selector ?? ""}
          onChange={(v) => onChange("selector", v)}
          placeholder="link[rel='stylesheet']"
          mono
        />
      );
    case "META_TAG":
      return (
        <>
          <Field
            label="Meta name"
            value={config.name ?? ""}
            onChange={(v) => onChange("name", v)}
            placeholder="robots"
          />
          <Field
            label="Expected content"
            value={config.content ?? ""}
            onChange={(v) => onChange("content", v)}
            placeholder="index, follow"
          />
        </>
      );
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gtc-green ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
