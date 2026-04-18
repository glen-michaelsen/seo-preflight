import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkViewport($: CheerioAPI): StandardCheckResult {
  const viewport = $('meta[name="viewport"]').attr("content")?.trim() ?? "";

  if (!viewport) {
    return {
      checkId: "viewport",
      label: "Viewport Meta Tag",
      category: "Mobile",
      status: "fail",
      message: "No viewport meta tag found. This is required for mobile-friendly pages.",
    };
  }

  const hasWidth = viewport.includes("width=device-width");

  return {
    checkId: "viewport",
    label: "Viewport Meta Tag",
    category: "Mobile",
    status: hasWidth ? "pass" : "warn",
    message: hasWidth
      ? "Viewport meta tag is correctly set."
      : `Viewport tag present but may not be optimal: "${viewport}".`,
    details: { viewport },
  };
}
