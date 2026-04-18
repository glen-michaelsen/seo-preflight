"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  profileId: string;
  initialData: string | null;        // cached base64 from DB (may be null for new profiles)
  screenshotUpdatedAt: string | null;
}

export default function SiteScreenshot({ profileId, initialData, screenshotUpdatedAt }: Props) {
  const [imgData, setImgData] = useState<string | null>(initialData);
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">(
    initialData ? "ready" : "idle"
  );

  const generate = useCallback(async () => {
    setStatus("generating");
    try {
      const res = await fetch(`/api/profiles/${profileId}/screenshot`, { method: "POST" });
      const json = await res.json();
      if (json.pending) {
        // mshots hasn't rendered yet — retry in 4s
        setTimeout(generate, 4000);
      } else if (json.screenshotData) {
        setImgData(json.screenshotData);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, [profileId]);

  // Auto-generate on mount if no cached data
  useEffect(() => {
    if (!initialData) {
      generate();
    }
  }, [initialData, generate]);

  const updatedLabel = screenshotUpdatedAt
    ? new Date(screenshotUpdatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative w-full h-full bg-gray-100 group/shot">
      {/* Skeleton pulse while generating */}
      {status === "generating" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-end justify-center pb-3">
          <span className="text-[10px] text-gray-400 tracking-wide">Capturing screenshot…</span>
        </div>
      )}

      {/* Error / unavailable state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
          <span className="text-xs text-gray-400">Preview unavailable</span>
          <button
            onClick={(e) => { e.preventDefault(); generate(); }}
            className="text-xs text-gtc-green hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cached screenshot */}
      {imgData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgData}
          alt="Website screenshot"
          className={`w-full h-full object-cover object-top transition-all duration-500 group-hover/card:scale-[1.02] ${
            status === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Refresh button (visible on card hover) */}
      {status === "ready" && (
        <button
          onClick={(e) => { e.preventDefault(); generate(); }}
          title={updatedLabel ? `Screenshot from ${updatedLabel}` : "Refresh screenshot"}
          className="absolute bottom-2 right-2 opacity-0 group-hover/shot:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm"
        >
          ↻ {updatedLabel ?? "Refresh"}
        </button>
      )}
    </div>
  );
}
