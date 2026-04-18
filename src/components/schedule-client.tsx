"use client";

import { useState } from "react";

type ScheduleType = "off" | "weekly" | "monthly";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default function ScheduleClient({
  profileId,
  initialType,
  initialDayOfWeek,
  initialDayOfMonth,
  scheduleLastRunAt,
}: {
  profileId: string;
  initialType: string | null;
  initialDayOfWeek: number | null;
  initialDayOfMonth: number | null;
  scheduleLastRunAt: string | null;
}) {
  const [type, setType] = useState<ScheduleType>(
    (initialType as ScheduleType) ?? "off"
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initialDayOfMonth ?? 1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(
    newType: ScheduleType,
    newDow: number,
    newDom: number
  ) {
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch(`/api/profiles/${profileId}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleType: newType === "off" ? null : newType,
        scheduleDayOfWeek: newDow,
        scheduleDayOfMonth: newDom,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError("Failed to save schedule.");
    }
  }

  function handleTypeChange(t: ScheduleType) {
    setType(t);
    save(t, dayOfWeek, dayOfMonth);
  }

  function handleDowChange(v: number) {
    setDayOfWeek(v);
    save(type, v, dayOfMonth);
  }

  function handleDomChange(v: number) {
    setDayOfMonth(v);
    save(type, dayOfWeek, v);
  }

  // Helper: describe the clamping behaviour for high day values
  function domNote(day: number): string | null {
    if (day <= 28) return null;
    if (day === 29) return "In February (non-leap years), runs on the 28th.";
    if (day === 30) return "In February, runs on the 28th or 29th.";
    return "In months with fewer days, runs on the last day of that month.";
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-700">Scheduled analysis</h2>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
          {saved && !saving && <span className="text-xs text-gtc-green">Saved</span>}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Type selector */}
      <div className="flex gap-2 mb-6">
        {(["off", "weekly", "monthly"] as ScheduleType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
              type === t
                ? "bg-gtc-green text-white border-gtc-green"
                : "bg-white text-gray-600 border-gray-300 hover:border-gtc-green/50"
            }`}
          >
            {t === "off" ? "No schedule" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Weekly: day of week picker */}
      {type === "weekly" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Run every week on
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleDowChange(d.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  dayOfWeek === d.value
                    ? "bg-gtc-green text-white border-gtc-green"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gtc-green/50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly: day of month picker */}
      {type === "monthly" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Run every month on day
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDomChange(day)}
                className={`w-9 h-9 rounded-lg text-sm border transition-colors ${
                  dayOfMonth === day
                    ? "bg-gtc-green text-white border-gtc-green font-semibold"
                    : day > 28
                    ? "bg-white text-gray-400 border-gray-200 hover:border-gtc-green/50"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gtc-green/50"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {domNote(dayOfMonth) && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ℹ️ {domNote(dayOfMonth)}
            </p>
          )}
        </div>
      )}

      {/* Summary + last run */}
      {type !== "off" && (
        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <p>
            <span className="font-medium text-gray-700">Schedule: </span>
            {type === "weekly" && (
              <>Every {DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label}</>
            )}
            {type === "monthly" && (
              <>Every month on day {dayOfMonth}</>
            )}
          </p>
          {scheduleLastRunAt ? (
            <p>
              <span className="font-medium text-gray-700">Last scheduled run: </span>
              {new Date(scheduleLastRunAt).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          ) : (
            <p className="text-gray-400">No scheduled run has fired yet.</p>
          )}
        </div>
      )}

      {type === "off" && (
        <p className="text-xs text-gray-400 mt-2">
          Analyses will only run when you click &quot;Run analysis&quot; manually.
        </p>
      )}
    </div>
  );
}
