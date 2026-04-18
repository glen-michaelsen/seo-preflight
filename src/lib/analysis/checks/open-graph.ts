import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkOpenGraph($: CheerioAPI): StandardCheckResult {
  const get = (prop: string) =>
    $(`meta[property="${prop}"]`).attr("content")?.trim() ?? "";

  const title = get("og:title");
  const description = get("og:description");
  const image = get("og:image");
  const url = get("og:url");

  const missing: string[] = [];
  if (!title) missing.push("og:title");
  if (!description) missing.push("og:description");
  if (!image) missing.push("og:image");

  if (missing.length === 3) {
    return {
      checkId: "open-graph",
      label: "Open Graph Tags",
      category: "Social",
      status: "warn",
      message: "No Open Graph tags found. These improve link previews on social media.",
    };
  }

  if (missing.length > 0) {
    return {
      checkId: "open-graph",
      label: "Open Graph Tags",
      category: "Social",
      status: "warn",
      message: `Missing Open Graph tags: ${missing.join(", ")}.`,
      details: { title, description, image, url },
    };
  }

  return {
    checkId: "open-graph",
    label: "Open Graph Tags",
    category: "Social",
    status: "pass",
    message: "All key Open Graph tags (title, description, image) are present.",
    details: { title, description, image, url },
  };
}
