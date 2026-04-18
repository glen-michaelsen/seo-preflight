export interface FetchResult {
  html: string;
  finalUrl: string;
  httpStatus: number;
  contentType: string;
}

export async function fetchUrl(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "SEOPreflight/1.0 (+https://seo-preflight.com/bot)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const html = await res.text();

    return {
      html,
      finalUrl: res.url,
      httpStatus: res.status,
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}
