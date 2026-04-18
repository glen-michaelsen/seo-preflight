import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkLang($: CheerioAPI): StandardCheckResult {
  const lang = $("html").attr("lang")?.trim() ?? "";

  if (!lang) {
    return {
      checkId: "lang",
      label: "HTML Language Attribute",
      category: "Accessibility & SEO",
      status: "warn",
      message: "No lang attribute on <html> element. Screen readers and search engines use this for language detection.",
    };
  }

  return {
    checkId: "lang",
    label: "HTML Language Attribute",
    category: "Accessibility & SEO",
    status: "pass",
    message: `Language is declared as "${lang}".`,
    details: { lang },
  };
}
