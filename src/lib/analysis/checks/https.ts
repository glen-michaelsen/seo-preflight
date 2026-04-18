import type { StandardCheckResult } from "@/types/analysis";

export function checkHttps(finalUrl: string): StandardCheckResult {
  const isHttps = finalUrl.startsWith("https://");

  return {
    checkId: "https",
    label: "HTTPS / SSL",
    category: "Security",
    status: isHttps ? "pass" : "fail",
    message: isHttps
      ? "Page is served over HTTPS."
      : "Page is not served over HTTPS. Google uses HTTPS as a ranking signal.",
    details: { url: finalUrl },
  };
}
