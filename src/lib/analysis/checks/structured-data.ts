import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkStructuredData($: CheerioAPI): StandardCheckResult {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const count = jsonLdScripts.length;

  if (count === 0) {
    return {
      checkId: "structured-data",
      label: "Structured Data (JSON-LD)",
      category: "Rich Results",
      status: "info",
      message: "No JSON-LD structured data found. Adding schema markup can enable rich results in search.",
    };
  }

  const types: string[] = [];
  jsonLdScripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "{}");
      const type = json["@type"];
      if (type) types.push(Array.isArray(type) ? type.join(", ") : type);
    } catch {
      // malformed JSON
    }
  });

  return {
    checkId: "structured-data",
    label: "Structured Data (JSON-LD)",
    category: "Rich Results",
    status: "pass",
    message: `${count} JSON-LD script(s) found${types.length ? `: ${types.join(", ")}` : ""}.`,
    details: { count, types },
  };
}
