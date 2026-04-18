"use client";

import { useState } from "react";

export default function SiteScreenshot({ url, name }: { url: string; name: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  // WordPress mshots: free, no key, renders real screenshots.
  // First hit returns a placeholder while rendering; subsequent hits return the real image.
  const src = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=600&h=400`;

  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Skeleton shown while loading */}
      {state === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Fallback shown on error */}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-xs text-gray-400">Preview unavailable</span>
        </div>
      )}

      {/* The actual screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Screenshot of ${name}`}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={`w-full h-full object-cover object-top transition-opacity duration-500 group-hover:scale-[1.02] transition-transform duration-300 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
