import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkTitle($: CheerioAPI): StandardCheckResult {
  const title = $("title").first().text().trim();

  if (!title) {
    return {
      checkId: "title",
      label: "Title Tag",
      category: "On-Page",
      status: "fail",
      message: "No <title> tag found.",
    };
  }

  const len = title.length;

  if (len < 10) {
    return {
      checkId: "title",
      label: "Title Tag",
      category: "On-Page",
      status: "warn",
      message: `Title is very short (${len} chars). Aim for 50–60 characters.`,
      details: { length: len, value: title },
    };
  }

  if (len > 70) {
    return {
      checkId: "title",
      label: "Title Tag",
      category: "On-Page",
      status: "warn",
      message: `Title is too long (${len} chars). Search engines may truncate after ~60 chars.`,
      details: { length: len, value: title },
    };
  }

  return {
    checkId: "title",
    label: "Title Tag",
    category: "On-Page",
    status: "pass",
    message: `Title is ${len} characters (optimal 50–60).`,
    details: { length: len, value: title },
  };
}
