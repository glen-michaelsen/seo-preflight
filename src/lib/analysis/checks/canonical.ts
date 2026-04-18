import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkCanonical($: CheerioAPI, finalUrl: string): StandardCheckResult {
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() ?? "";

  if (!canonical) {
    return {
      checkId: "canonical",
      label: "Canonical Tag",
      category: "Indexability",
      status: "warn",
      message: "No canonical tag found. Consider adding one to prevent duplicate content issues.",
    };
  }

  const isSelf =
    canonical === finalUrl ||
    canonical.replace(/\/$/, "") === finalUrl.replace(/\/$/, "");

  return {
    checkId: "canonical",
    label: "Canonical Tag",
    category: "Indexability",
    status: isSelf ? "pass" : "warn",
    message: isSelf
      ? "Canonical tag is self-referencing (correct)."
      : `Canonical points to a different URL: ${canonical}`,
    details: { canonical, finalUrl },
  };
}
