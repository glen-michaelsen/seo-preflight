"use client";

import { useState, useMemo } from "react";
import type {
  PageResult,
  StandardCheckResult,
  CustomCheckResult,
  CheckStatus,
} from "@/types/analysis";

type Filter = "all" | "fail" | "warn" | "pass";

interface Totals {
  pass: number;
  warn: number;
  fail: number;
}

interface Props {
  pagesByGroup: Record<string, PageResult[]>;
  totals: Totals;
}

// Which check statuses are visible under a given filter
function checkMatchesFilter(status: string, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "fail") return status === "fail" || status === "error";
  if (filter === "warn") return status === "warn";
  if (filter === "pass") return status === "pass" || status === "info";
  return true;
}

// Whether a page should be visible under a given filter
function pageMatchesFilter(page: PageResult, filter: Filter): boolean {
  if (filter === "all") return true;
  const allChecks = [
    ...page.standard.map((c) => c.status),
    ...page.custom.map((c) => c.status),
  ];
  if (filter === "fail") return allChecks.some((s) => s === "fail" || s === "error");
  if (filter === "warn") return allChecks.some((s) => s === "warn");
  if (filter === "pass")
    return !allChecks.some((s) => s === "fail" || s === "error" || s === "warn");
  return true;
}

export default function AnalysisResultsClient({ pagesByGroup, totals }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const allPages = useMemo(
    () => Object.values(pagesByGroup).flat(),
    [pagesByGroup]
  );

  const toggleFilter = (f: Filter) => {
    setFilter((prev) => (prev === f ? "all" : f));
  };

  const expandAll = () =>
    setExpandedPages(new Set(allPages.map((p) => p.pageId)));
  const collapseAll = () => setExpandedPages(new Set());

  const togglePage = (pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  return (
    <div>
      {/* Header row: filter pills + expand controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {/* Score pills — click to filter */}
        <div className="flex gap-2.5 flex-wrap">
          <ScorePill
            label="Pass"
            count={totals.pass}
            color="green"
            active={filter === "pass"}
            onClick={() => toggleFilter("pass")}
          />
          <ScorePill
            label="Warn"
            count={totals.warn}
            color="yellow"
            active={filter === "warn"}
            onClick={() => toggleFilter("warn")}
          />
          <ScorePill
            label="Fail"
            count={totals.fail}
            color="red"
            active={filter === "fail"}
            onClick={() => toggleFilter("fail")}
          />
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 transition-colors"
            >
              Clear filter ×
            </button>
          )}
        </div>

        {/* Expand / collapse */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Groups + pages */}
      <div className="space-y-10">
        {Object.entries(pagesByGroup).map(([groupName, pages]) => {
          const filtered = pages.filter((p) => pageMatchesFilter(p, filter));
          if (filtered.length === 0) return null;
          return (
            <section key={groupName}>
              <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-sm">
                  {groupName}
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {filtered.length} page{filtered.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div className="space-y-4">
                {filtered.map((page) => (
                  <PageResultCard
                    key={page.pageId}
                    page={page}
                    filter={filter}
                    open={expandedPages.has(page.pageId)}
                    onToggle={() => togglePage(page.pageId)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filter !== "all" &&
        allPages.filter((p) => pageMatchesFilter(p, filter)).length === 0 && (
          <p className="text-center text-gray-400 py-12">
            No pages match this filter.
          </p>
        )}
    </div>
  );
}

// ── Score pill (clickable filter button) ────────────────────────────────────

function ScorePill({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: "green" | "yellow" | "red";
  active: boolean;
  onClick: () => void;
}) {
  const styles = {
    green: {
      base: "border-green-200 text-green-700",
      inactive: "bg-green-50 hover:bg-green-100",
      active: "bg-green-600 text-white border-green-600",
    },
    yellow: {
      base: "border-yellow-200 text-yellow-700",
      inactive: "bg-yellow-50 hover:bg-yellow-100",
      active: "bg-yellow-500 text-white border-yellow-500",
    },
    red: {
      base: "border-red-200 text-red-700",
      inactive: "bg-red-50 hover:bg-red-100",
      active: "bg-red-600 text-white border-red-600",
    },
  };
  const s = styles[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer select-none ${
        active ? `${s.active}` : `${s.base} ${s.inactive}`
      }`}
    >
      <span className="text-lg font-bold">{count}</span>
      <span className="font-normal text-xs">{label}</span>
    </button>
  );
}

// ── Page result card ─────────────────────────────────────────────────────────

function PageResultCard({
  page,
  filter,
  open,
  onToggle,
}: {
  page: PageResult;
  filter: Filter;
  open: boolean;
  onToggle: () => void;
}) {
  // Summary pill counts always reflect full page (not filtered)
  const pass = [
    ...page.standard.filter((c) => c.status === "pass" || c.status === "info"),
    ...page.custom.filter((c) => c.status === "pass"),
  ].length;
  const warn = page.standard.filter((c) => c.status === "warn").length;
  const fail = [
    ...page.standard.filter((c) => c.status === "fail"),
    ...page.custom.filter((c) => c.status === "fail" || c.status === "error"),
  ].length;

  // Visible checks depend on active filter
  const visibleStandard = page.standard.filter((c) =>
    checkMatchesFilter(c.status, filter)
  );
  const visibleCustom = page.custom.filter((c) =>
    checkMatchesFilter(c.status, filter)
  );

  // Group visible standard checks by category
  const grouped = visibleStandard.reduce<Record<string, StandardCheckResult[]>>(
    (acc, check) => {
      (acc[check.category] ??= []).push(check);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-semibold text-gtc-green">
              {page.path}
            </code>
            {page.label && (
              <span className="text-sm text-gray-500">{page.label}</span>
            )}
            <span className="text-xs text-gray-400">HTTP {page.httpStatus}</span>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{page.finalUrl}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {fail > 0 && <MiniPill count={fail} color="red" />}
          {warn > 0 && <MiniPill count={warn} color="yellow" />}
          {pass > 0 && <MiniPill count={pass} color="green" />}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded check list — filtered */}
      {open && (
        <div className="border-t border-gray-100">
          {Object.entries(grouped).map(([category, checks]) => (
            <div key={category}>
              <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                {category}
              </p>
              <div className="divide-y divide-gray-100">
                {checks.map((check) => (
                  <CheckRow key={check.checkId} check={check} />
                ))}
              </div>
            </div>
          ))}

          {visibleCustom.length > 0 && (
            <div>
              <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                Custom checks
              </p>
              <div className="divide-y divide-gray-100">
                {visibleCustom.map((check) => (
                  <CustomCheckRow key={check.checkId} check={check} />
                ))}
              </div>
            </div>
          )}

          {visibleStandard.length === 0 && visibleCustom.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 italic">
              No{" "}
              {filter === "fail"
                ? "errors"
                : filter === "warn"
                ? "warnings"
                : "passing checks"}{" "}
              on this page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Check rows ───────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: StandardCheckResult }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="px-5 py-3.5 flex items-start gap-4">
      <StatusIcon status={check.status} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{check.label}</p>
        <p className="text-sm text-gray-600 mt-0.5">{check.message}</p>
        {check.details && Object.keys(check.details).length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {detailsOpen ? "Hide details" : "Details"}
            </button>
            {detailsOpen && (
              <table className="mt-1.5 text-xs w-full border border-gray-100 rounded overflow-hidden">
                <tbody>
                  {Object.entries(check.details).map(([key, value]) => (
                    <tr
                      key={key}
                      className="border-t border-gray-100 odd:bg-white even:bg-gray-50"
                    >
                      <td className="py-1.5 px-3 font-medium text-gray-500 whitespace-nowrap w-1/3 align-top">
                        {key}
                      </td>
                      <td className="py-1.5 px-3 text-gray-700 break-all">
                        {formatDetailValue(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <StatusBadge status={check.status} />
    </div>
  );
}

function CustomCheckRow({ check }: { check: CustomCheckResult }) {
  return (
    <div className="px-5 py-3.5 flex items-start gap-4">
      <StatusIcon status={check.status as CheckStatus} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{check.name}</p>
        <p className="text-sm text-gray-600 mt-0.5">{check.message}</p>
      </div>
      <StatusBadge status={check.status as CheckStatus} />
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

function formatDetailValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  if (value === null || value === undefined) return "—";
  return String(value);
}

function StatusIcon({ status }: { status: CheckStatus | "error" }) {
  if (status === "pass")
    return (
      <span className="mt-0.5 text-green-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  if (status === "fail" || status === "error")
    return (
      <span className="mt-0.5 text-red-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  if (status === "warn")
    return (
      <span className="mt-0.5 text-yellow-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  return (
    <span className="mt-0.5 text-blue-400 shrink-0">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function StatusBadge({ status }: { status: CheckStatus | "error" }) {
  const map: Record<string, string> = {
    pass: "bg-green-100 text-green-700",
    warn: "bg-yellow-100 text-yellow-700",
    fail: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${
        map[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function MiniPill({
  count,
  color,
}: {
  count: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>
      {count}
    </span>
  );
}
