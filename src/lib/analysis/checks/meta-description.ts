import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkMetaDescription($: CheerioAPI): StandardCheckResult {
  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";

  if (!desc) {
    return {
      checkId: "meta-description",
      label: "Meta Description",
      category: "On-Page",
      status: "fail",
      message: "No meta description found.",
    };
  }

  const len = desc.length;

  if (len < 50) {
    return {
      checkId: "meta-description",
      label: "Meta Description",
      category: "On-Page",
      status: "warn",
      message: `Meta description is short (${len} chars). Aim for 120–160 characters.`,
      details: { length: len, value: desc },
    };
  }

  if (len > 170) {
    return {
      checkId: "meta-description",
      label: "Meta Description",
      category: "On-Page",
      status: "warn",
      message: `Meta description is too long (${len} chars). Search engines may truncate after ~160 chars.`,
      details: { length: len, value: desc },
    };
  }

  return {
    checkId: "meta-description",
    label: "Meta Description",
    category: "On-Page",
    status: "pass",
    message: `Meta description is ${len} characters (optimal 120–160).`,
    details: { length: len, value: desc },
  };
}
