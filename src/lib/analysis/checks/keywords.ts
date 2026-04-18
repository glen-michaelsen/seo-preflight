import type { CheerioAPI } from "cheerio";
import type { StandardCheckResult } from "@/types/analysis";

// ── helpers ─────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Count exact phrase occurrences (word-boundary aware, case-insensitive). */
function countPhrase(haystack: string, phrase: string): number {
  if (!phrase) return 0;
  // Escape regex special chars, then anchor on word boundaries
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "gi");
  return (haystack.match(re) ?? []).length;
}

/** Check whether a keyword phrase is represented in a URL path.
 *  Handles slug forms: "buy shoes" → "buy-shoes", "buy_shoes", "buyshoes".
 */
function keywordInUrl(path: string, kwNorm: string): boolean {
  const p = path.toLowerCase();
  // All individual words present anywhere in the path
  return kwNorm.split(/\s+/).every((word) => p.includes(word));
}

/** Extract readable body text — strips scripts, styles, and hidden elements. */
function bodyText($: CheerioAPI): string {
  const clone = $("body").clone();
  clone.find("script, style, noscript, [hidden]").remove();
  return clone.text().replace(/\s+/g, " ").trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── main export ──────────────────────────────────────────────────────────────

export function checkKeywords(
  $: CheerioAPI,
  path: string,
  keywords: string[]
): StandardCheckResult[] {
  if (keywords.length === 0) return [];

  const text = bodyText($);
  const textNorm = norm(text);
  const totalWords = wordCount(text);

  const title = norm($("title").first().text());
  const metaDesc = norm(
    $('meta[name="description"]').attr("content") ?? ""
  );
  const h1 = norm($("h1").first().text());
  const subheadings = norm(
    $("h2,h3,h4,h5,h6")
      .map((_, el) => $(el).text())
      .get()
      .join(" ")
  );
  const altTexts = norm(
    $("img[alt]")
      .map((_, el) => $(el).attr("alt") ?? "")
      .get()
      .join(" ")
  );

  const results: StandardCheckResult[] = [];

  for (const kw of keywords) {
    const kwNorm = norm(kw);
    const slug = `kw-${kwNorm.replace(/\s+/g, "-")}`;
    const cat = `Keyword: ${kw}`;

    // 1 ─ Title
    const inTitle = title.includes(kwNorm);
    results.push({
      checkId: `${slug}-title`,
      label: `"${kw}" — title tag`,
      category: cat,
      status: inTitle ? "pass" : "warn",
      message: inTitle
        ? `Keyword appears in the title tag.`
        : `Keyword not found in the title tag. Including it is one of the strongest on-page signals.`,
      details: { title: title || "(none)" },
    });

    // 2 ─ Meta description
    const inMeta = metaDesc.includes(kwNorm);
    results.push({
      checkId: `${slug}-meta-desc`,
      label: `"${kw}" — meta description`,
      category: cat,
      status: inMeta ? "pass" : "warn",
      message: inMeta
        ? `Keyword appears in the meta description.`
        : `Keyword not found in meta description. Adding it improves snippet relevance.`,
    });

    // 3 ─ H1
    const inH1 = h1.includes(kwNorm);
    results.push({
      checkId: `${slug}-h1`,
      label: `"${kw}" — H1`,
      category: cat,
      status: inH1 ? "pass" : "warn",
      message: inH1
        ? `Keyword appears in the H1.`
        : `Keyword not found in the H1. H1 is the primary content heading — a key relevance signal.`,
      details: { h1: h1 || "(none)" },
    });

    // 4 ─ Subheadings (H2–H6)
    const inSubs = subheadings.includes(kwNorm);
    results.push({
      checkId: `${slug}-subheadings`,
      label: `"${kw}" — subheadings (H2–H6)`,
      category: cat,
      status: inSubs ? "pass" : "info",
      message: inSubs
        ? `Keyword found in at least one H2–H6 subheading.`
        : `Keyword not found in any H2–H6 subheading. Adding it reinforces topical relevance.`,
    });

    // 5 ─ URL / path
    const inUrl = keywordInUrl(path, kwNorm);
    results.push({
      checkId: `${slug}-url`,
      label: `"${kw}" — URL`,
      category: cat,
      status: inUrl ? "pass" : "info",
      message: inUrl
        ? `Keyword (or its words) found in the URL path.`
        : `Keyword not reflected in the URL path. Keyword-rich URLs can improve click-through rates.`,
      details: { path },
    });

    // 6 ─ Image alt text
    const inAlt = altTexts.includes(kwNorm);
    results.push({
      checkId: `${slug}-alt`,
      label: `"${kw}" — image alt text`,
      category: cat,
      status: inAlt ? "pass" : "info",
      message: inAlt
        ? `Keyword appears in at least one image alt attribute.`
        : `Keyword not found in any image alt text. Relevant alt text can support keyword signals.`,
    });

    // 7 ─ Body density
    const occurrences = countPhrase(textNorm, kwNorm);
    const kwWords = kwNorm.split(/\s+/).length;
    const density =
      totalWords > 0 ? (occurrences * kwWords) / totalWords : 0;
    const densityPct = (density * 100).toFixed(2);

    let densityStatus: StandardCheckResult["status"];
    let densityMsg: string;

    if (occurrences === 0) {
      densityStatus = "fail";
      densityMsg = `Keyword "${kw}" not found in the body text. Make sure it appears naturally in the content.`;
    } else if (density < 0.005) {
      // < 0.5 %
      densityStatus = "warn";
      densityMsg = `Density is ${densityPct}% (${occurrences} occurrence${occurrences !== 1 ? "s" : ""} / ~${totalWords} words) — below the recommended 0.5–3%.`;
    } else if (density > 0.03) {
      // > 3 %
      densityStatus = "warn";
      densityMsg = `Density is ${densityPct}% (${occurrences} occurrence${occurrences !== 1 ? "s" : ""} / ~${totalWords} words) — above 3%, which may look like keyword stuffing.`;
    } else {
      densityStatus = "pass";
      densityMsg = `Density is ${densityPct}% (${occurrences} occurrence${occurrences !== 1 ? "s" : ""} / ~${totalWords} words) — within the optimal 0.5–3% range.`;
    }

    results.push({
      checkId: `${slug}-density`,
      label: `"${kw}" — keyword density`,
      category: cat,
      status: densityStatus,
      message: densityMsg,
      details: {
        occurrences,
        "total words": totalWords,
        density: `${densityPct}%`,
        "optimal range": "0.5 – 3%",
      },
    });
  }

  return results;
}
