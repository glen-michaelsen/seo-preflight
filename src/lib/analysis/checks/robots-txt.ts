import type { StandardCheckResult } from "@/types/analysis";

export async function checkRobotsTxt(finalUrl: string): Promise<StandardCheckResult> {
  try {
    const origin = new URL(finalUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;

    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": "SEOPreflight/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        checkId: "robots-txt",
        label: "Robots.txt",
        category: "Crawlability",
        status: "warn",
        message: `robots.txt returned HTTP ${res.status}. Search engines expect a 200 response.`,
        details: { url: robotsUrl, status: res.status },
      };
    }

    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim().toLowerCase());

    // Check for "Disallow: /" under "User-agent: *"
    let inStarBlock = false;
    let disallowsAll = false;

    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        inStarBlock = line === "user-agent: *" || line === "user-agent:*";
      } else if (inStarBlock && (line === "disallow: /" || line === "disallow:/")) {
        disallowsAll = true;
        break;
      }
    }

    if (disallowsAll) {
      return {
        checkId: "robots-txt",
        label: "Robots.txt",
        category: "Crawlability",
        status: "fail",
        message: "robots.txt blocks all crawlers with 'Disallow: /'. Search engines cannot index this site.",
        details: { url: robotsUrl },
      };
    }

    return {
      checkId: "robots-txt",
      label: "Robots.txt",
      category: "Crawlability",
      status: "pass",
      message: "robots.txt is accessible and does not block all crawlers.",
      details: { url: robotsUrl },
    };
  } catch {
    return {
      checkId: "robots-txt",
      label: "Robots.txt",
      category: "Crawlability",
      status: "warn",
      message: "Could not fetch robots.txt.",
    };
  }
}
