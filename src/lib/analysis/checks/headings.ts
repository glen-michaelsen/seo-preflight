import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkHeadings($: CheerioAPI): StandardCheckResult {
  const h1s = $("h1");
  const h1Count = h1s.length;
  const h1Texts = h1s
    .map((_, el) => $(el).text().trim())
    .get()
    .slice(0, 3);

  const counts = {
    h1: h1Count,
    h2: $("h2").length,
    h3: $("h3").length,
    h4: $("h4").length,
    h5: $("h5").length,
    h6: $("h6").length,
  };

  if (h1Count === 0) {
    return {
      checkId: "headings",
      label: "Heading Structure",
      category: "On-Page",
      status: "fail",
      message: "No H1 tag found. Every page should have exactly one H1.",
      details: { counts },
    };
  }

  if (h1Count > 1) {
    return {
      checkId: "headings",
      label: "Heading Structure",
      category: "On-Page",
      status: "warn",
      message: `${h1Count} H1 tags found. Use exactly one H1 per page.`,
      details: { counts, h1Texts },
    };
  }

  return {
    checkId: "headings",
    label: "Heading Structure",
    category: "On-Page",
    status: "pass",
    message: `Exactly one H1 found. ${counts.h2} H2s, ${counts.h3} H3s.`,
    details: { counts, h1Texts },
  };
}
