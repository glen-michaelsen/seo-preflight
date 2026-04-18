"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunAnalysisButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/profiles/${profileId}/analyses`, {
      method: "POST",
    });

    setLoading(false);

    if (!res.ok) {
      setError("Analysis failed. Try again.");
      return;
    }

    const analysis = await res.json();
    router.push(`/profiles/${profileId}/analyses/${analysis.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRun}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {loading ? "Analysing…" : "Run analysis"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
