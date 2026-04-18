import type { CheerioAPI } from "cheerio";
import type { CustomCheckResult } from "@/types/analysis";

type CustomCheckType =
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "REGEX"
  | "SELECTOR_EXISTS"
  | "META_TAG";

interface CustomCheckDef {
  id: string;
  name: string;
  type: string;
  config: string;
}

type ContainsConfig = { value: string };
type RegexConfig = { pattern: string; flags?: string };
type SelectorConfig = { selector: string };
type MetaTagConfig = { name: string; content: string };

export function runCustomChecks(
  checks: CustomCheckDef[],
  $: CheerioAPI,
  html: string
): CustomCheckResult[] {
  return checks.map((check) => {
    try {
      const config = JSON.parse(check.config);

      switch (check.type as CustomCheckType) {
        case "CONTAINS": {
          const { value } = config as ContainsConfig;
          const found = html.includes(value);
          return {
            checkId: check.id,
            name: check.name,
            status: found ? "pass" : "fail",
            message: found
              ? `HTML contains "${value}".`
              : `HTML does not contain "${value}".`,
          };
        }

        case "NOT_CONTAINS": {
          const { value } = config as ContainsConfig;
          const found = html.includes(value);
          return {
            checkId: check.id,
            name: check.name,
            status: !found ? "pass" : "fail",
            message: !found
              ? `HTML does not contain "${value}" (expected).`
              : `HTML unexpectedly contains "${value}".`,
          };
        }

        case "REGEX": {
          const { pattern, flags } = config as RegexConfig;
          const regex = new RegExp(pattern, flags ?? "");
          const matches = regex.test(html);
          return {
            checkId: check.id,
            name: check.name,
            status: matches ? "pass" : "fail",
            message: matches
              ? `HTML matches pattern /${pattern}/.`
              : `HTML does not match pattern /${pattern}/.`,
          };
        }

        case "SELECTOR_EXISTS": {
          const { selector } = config as SelectorConfig;
          const exists = $(selector).length > 0;
          return {
            checkId: check.id,
            name: check.name,
            status: exists ? "pass" : "fail",
            message: exists
              ? `Selector "${selector}" found (${$(selector).length} element(s)).`
              : `Selector "${selector}" not found in page.`,
          };
        }

        case "META_TAG": {
          const { name, content } = config as MetaTagConfig;
          const actual = $(`meta[name="${name}"]`).attr("content")?.trim() ?? "";
          const matches =
            actual.toLowerCase() === content.toLowerCase();
          return {
            checkId: check.id,
            name: check.name,
            status: matches ? "pass" : "fail",
            message: matches
              ? `Meta tag "${name}" has expected content "${content}".`
              : actual
              ? `Meta tag "${name}" has content "${actual}" (expected "${content}").`
              : `Meta tag "${name}" not found.`,
          };
        }

        default:
          return {
            checkId: check.id,
            name: check.name,
            status: "error",
            message: "Unknown check type.",
          };
      }
    } catch (err) {
      return {
        checkId: check.id,
        name: check.name,
        status: "error",
        message: `Check failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  });
}
