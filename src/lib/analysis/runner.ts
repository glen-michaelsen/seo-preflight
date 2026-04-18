import * as cheerio from "cheerio";
import { fetchUrl } from "./fetcher";
import { checkTitle } from "./checks/title";
import { checkMetaDescription } from "./checks/meta-description";
import { checkHeadings } from "./checks/headings";
import { checkImages } from "./checks/images";
import { checkCanonical } from "./checks/canonical";
import { checkRobotsMeta } from "./checks/robots-meta";
import { checkOpenGraph } from "./checks/open-graph";
import { checkStructuredData } from "./checks/structured-data";
import { checkRobotsTxt } from "./checks/robots-txt";
import { checkHttps } from "./checks/https";
import { checkViewport } from "./checks/viewport";
import { checkLang } from "./checks/lang";
import { checkFavicon } from "./checks/favicon";
import { runCustomChecks } from "./custom-checks/runner";
import type { AnalysisResults, PageResult } from "@/types/analysis";

interface PageInput {
  id: string;
  path: string;
  label: string | null;
  groupId: string;
  groupName: string;
}

interface CustomCheckInput {
  id: string;
  name: string;
  type: string;
  config: string;
  // groupIds: which groups this check applies to.
  // Empty array = applies to ALL pages.
  groupIds: string[];
}

function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function analyzePage(
  page: PageInput,
  baseUrl: string,
  customChecks: CustomCheckInput[]
): Promise<PageResult> {
  const url = buildUrl(baseUrl, page.path);
  const { html, finalUrl, httpStatus } = await fetchUrl(url);
  const $ = cheerio.load(html);

  const [robotsTxtResult] = await Promise.all([checkRobotsTxt(finalUrl)]);

  const standard = [
    checkHttps(finalUrl),
    checkTitle($),
    checkMetaDescription($),
    checkHeadings($),
    checkImages($),
    checkCanonical($, finalUrl),
    checkRobotsMeta($),
    checkOpenGraph($),
    checkStructuredData($),
    robotsTxtResult,
    checkViewport($),
    checkLang($),
    checkFavicon($),
  ];

  // Only run custom checks that apply to this page's group (or have no group filter)
  const applicable = customChecks.filter(
    (c) => c.groupIds.length === 0 || c.groupIds.includes(page.groupId)
  );
  const custom = runCustomChecks(applicable, $, html);

  return {
    pageId: page.id,
    path: page.path,
    label: page.label,
    url,
    groupId: page.groupId,
    groupName: page.groupName,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    httpStatus,
    standard,
    custom,
  };
}

export async function runAnalysis(
  baseUrl: string,
  pages: PageInput[],
  customChecks: CustomCheckInput[]
): Promise<AnalysisResults> {
  // If no pages are defined, fall back to root
  const targets: PageInput[] =
    pages.length > 0
      ? pages
      : [
          {
            id: "__root__",
            path: "/",
            label: null,
            groupId: "__default__",
            groupName: "Default",
          },
        ];

  const pageResults = await Promise.allSettled(
    targets.map((p) => analyzePage(p, baseUrl, customChecks))
  );

  const pages_out: PageResult[] = pageResults.map((result, i) => {
    if (result.status === "fulfilled") return result.value;

    const target = targets[i];
    return {
      pageId: target.id,
      path: target.path,
      label: target.label,
      url: buildUrl(baseUrl, target.path),
      groupId: target.groupId,
      groupName: target.groupName,
      finalUrl: buildUrl(baseUrl, target.path),
      fetchedAt: new Date().toISOString(),
      httpStatus: 0,
      standard: [
        {
          checkId: "fetch-error",
          label: "Page fetch",
          category: "Crawlability",
          status: "fail" as const,
          message: `Could not fetch page: ${result.reason instanceof Error ? result.reason.message : "Unknown error"}`,
        },
      ],
      custom: [],
    };
  });

  return {
    analyzedAt: new Date().toISOString(),
    pages: pages_out,
  };
}
