import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkFavicon($: CheerioAPI): StandardCheckResult {
  const favicon =
    $('link[rel="icon"]').attr("href") ??
    $('link[rel="shortcut icon"]').attr("href") ??
    $('link[rel="apple-touch-icon"]').attr("href") ??
    "";

  if (!favicon) {
    return {
      checkId: "favicon",
      label: "Favicon",
      category: "On-Page",
      status: "warn",
      message: "No favicon link tag found in <head>.",
    };
  }

  return {
    checkId: "favicon",
    label: "Favicon",
    category: "On-Page",
    status: "pass",
    message: "Favicon is declared.",
    details: { href: favicon },
  };
}
