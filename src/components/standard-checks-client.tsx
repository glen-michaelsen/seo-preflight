"use client";

import { useState } from "react";
import { STANDARD_CHECKS } from "@/lib/analysis/standard-checks-catalog";

// Group checks by category for display
const CATEGORIES = Array.from(new Set(STANDARD_CHECKS.map((c) => c.category)));

export default function StandardChecksClient({
  profileId,
  initialDisabled,
}: {
  profileId: string;
  initialDisabled: string[];
}) {
  const [disabled, setDisabled] = useState<Set<string>>(new Set(initialDisabled));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle(id: string) {
    const next = new Set(disabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDisabled(next);
    await save(next);
  }

  async function save(state: Set<string>) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/profiles/${profileId}/standard-checks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabledChecks: Array.from(state) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const enabledCount = STANDARD_CHECKS.length - disabled.size;

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">
          {enabledCount} of {STANDARD_CHECKS.length} check{STANDARD_CHECKS.length !== 1 ? "s" : ""} enabled
        </p>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && !saving && <span className="text-xs text-gtc-green">Saved</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {CATEGORIES.map((cat) => {
          const checks = STANDARD_CHECKS.filter((c) => c.category === cat);
          const allEnabled = checks.every((c) => !disabled.has(c.id));
          const allDisabled = checks.every((c) => disabled.has(c.id));

          return (
            <div key={cat}>
              {/* Category header */}
              <div className="px-5 py-2.5 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {cat}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(disabled);
                    if (allDisabled) {
                      checks.forEach((c) => next.delete(c.id));
                    } else {
                      checks.forEach((c) => next.add(c.id));
                    }
                    setDisabled(next);
                    save(next);
                  }}
                  className="text-xs text-gray-400 hover:text-gtc-green transition-colors"
                >
                  {allDisabled ? "Enable all" : allEnabled ? "Disable all" : "Disable all"}
                </button>
              </div>

              {/* Individual checks */}
              {checks.map((check) => {
                const enabled = !disabled.has(check.id);
                return (
                  <div
                    key={check.id}
                    className={`px-5 py-3.5 flex items-start gap-4 transition-colors ${
                      enabled ? "" : "bg-gray-50/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(check.id)}
                      className={`mt-0.5 w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                        enabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={enabled ? "Click to disable" : "Click to enable"}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div className={`flex-1 min-w-0 transition-opacity ${enabled ? "opacity-100" : "opacity-40"}`}>
                      <p className="text-sm font-medium text-gray-900">{check.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
