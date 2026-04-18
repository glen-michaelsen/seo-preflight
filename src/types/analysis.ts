export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface StandardCheckResult {
  checkId: string;
  label: string;
  category: string;
  status: CheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface CustomCheckResult {
  checkId: string;
  name: string;
  status: "pass" | "fail" | "error";
  message: string;
}

export interface PageResult {
  pageId: string;
  path: string;
  label: string | null;
  url: string;
  groupId: string;
  groupName: string;
  finalUrl: string;
  fetchedAt: string;
  httpStatus: number;
  standard: StandardCheckResult[];
  custom: CustomCheckResult[];
}

export interface AnalysisResults {
  analyzedAt: string;
  pages: PageResult[];
}
