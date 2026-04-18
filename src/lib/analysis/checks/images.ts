import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkImages($: CheerioAPI): StandardCheckResult {
  const allImages = $("img");
  const total = allImages.length;

  if (total === 0) {
    return {
      checkId: "images",
      label: "Image Alt Tags",
      category: "Accessibility & SEO",
      status: "info",
      message: "No images found on this page.",
      details: { total: 0, missing: 0 },
    };
  }

  const missing: string[] = [];
  allImages.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null) {
      const src = $(el).attr("src") ?? "(no src)";
      missing.push(src);
    }
  });

  if (missing.length === 0) {
    return {
      checkId: "images",
      label: "Image Alt Tags",
      category: "Accessibility & SEO",
      status: "pass",
      message: `All ${total} image(s) have alt attributes.`,
      details: { total, missing: 0 },
    };
  }

  return {
    checkId: "images",
    label: "Image Alt Tags",
    category: "Accessibility & SEO",
    status: "fail",
    message: `${missing.length} of ${total} image(s) are missing alt attributes.`,
    details: { total, missing: missing.length, missingSrcs: missing.slice(0, 10) },
  };
}
