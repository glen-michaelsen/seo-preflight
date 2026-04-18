import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

export function checkRobotsMeta($: CheerioAPI): StandardCheckResult {
  const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  const googlebot = $('meta[name="googlebot"]').attr("content")?.toLowerCase() ?? "";

  const combined = `${robotsMeta} ${googlebot}`.trim();

  const isNoindex = combined.includes("noindex");
  const isNofollow = combined.includes("nofollow");

  if (isNoindex) {
    return {
      checkId: "robots-meta",
      label: "Robots Meta Tag",
      category: "Indexability",
      status: "fail",
      message: "Page has noindex directive — search engines will not index this page.",
      details: { robotsMeta, googlebot },
    };
  }

  if (isNofollow) {
    return {
      checkId: "robots-meta",
      label: "Robots Meta Tag",
      category: "Indexability",
      status: "warn",
      message: "Page has nofollow directive — link equity will not be passed from this page.",
      details: { robotsMeta, googlebot },
    };
  }

  if (!robotsMeta) {
    return {
      checkId: "robots-meta",
      label: "Robots Meta Tag",
      category: "Indexability",
      status: "info",
      message: "No robots meta tag found. Default behaviour is index, follow.",
    };
  }

  return {
    checkId: "robots-meta",
    label: "Robots Meta Tag",
    category: "Indexability",
    status: "pass",
    message: `Robots meta is set to: "${robotsMeta}".`,
    details: { robotsMeta, googlebot },
  };
}
