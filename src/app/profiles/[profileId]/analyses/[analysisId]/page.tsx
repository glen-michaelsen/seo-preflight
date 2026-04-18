import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type {
  AnalysisResults,
  PageResult,
  StandardCheckResult,
  CustomCheckResult,
  CheckStatus,
} from "@/types/analysis";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ profileId: string; analysisId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { profileId, analysisId } = await params;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session.user.id) notFound();

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.profileId !== profileId) notFound();

  const results: AnalysisResults | null = analysis.results
    ? JSON.parse(analysis.results)
    : null;

  // Aggregate totals across all pages
  const totals = results
    ? results.pages.reduce(
        (acc, page) => {
          page.standard.forEach((c) => {
            if (c.status === "pass") acc.pass++;
            else if (c.status === "warn") acc.warn++;
            else if (c.status === "fail") acc.fail++;
          });
          page.custom.forEach((c) => {
            if (c.status === "pass") acc.pass++;
            else if (c.status === "fail") acc.fail++;
          });
          return acc;
        },
        { pass: 0, warn: 0, fail: 0 }
      )
    : null;

  // Group pages by group name for display
  const pagesByGroup = results
    ? results.pages.reduce<Record<string, PageResult[]>>((acc, page) => {
        (acc[page.groupName] ??= []).push(page);
        return acc;
      }, {})
    : {};

  return (
    <div>
      <Link
        href={`/profiles/${profileId}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {profile.name}
      </Link>

      <div className="mt-3 mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis results</h1>
          {results && (
            <p className="text-sm text-gray-500 mt-1">
              {results.pages.length} page{results.pages.length !== 1 ? "s" : ""} ·{" "}
              {new Date(results.analyzedAt).toLocaleString("en-GB")}
            </p>
          )}
        </div>
        {totals && (
          <div className="flex gap-3">
            <ScorePill label="Pass" count={totals.pass} color="green" />
            <ScorePill label="Warn" count={totals.warn} color="yellow" />
            <ScorePill label="Fail" count={totals.fail} color="red" />
          </div>
        )}
      </div>

      {analysis.status === "ERROR" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 mb-6">
          <p className="font-semibold">Analysis failed</p>
          <p className="text-sm mt-1">{analysis.errorMessage ?? "Unknown error."}</p>
        </div>
      )}

      {results && (
        <div className="space-y-10">
          {Object.entries(pagesByGroup).map(([groupName, pages]) => (
            <section key={groupName}>
              <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-sm">
                  {groupName}
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {pages.length} page{pages.length !== 1 ? "s" : ""}
                </span>
              </h2>

              <div className="space-y-4">
                {pages.map((page) => (
                  <PageResultCard key={page.pageId} page={page} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function PageResultCard({ page }: { page: PageResult }) {
  const pass = [
    ...page.standard.filter((c) => c.status === "pass"),
    ...page.custom.filter((c) => c.status === "pass"),
  ].length;
  const warn = page.standard.filter((c) => c.status === "warn").length;
  const fail = [
    ...page.standard.filter((c) => c.status === "fail"),
    ...page.custom.filter((c) => c.status === "fail" || c.status === "error"),
  ].length;

  const grouped = page.standard.reduce<Record<string, StandardCheckResult[]>>(
    (acc, check) => {
      (acc[check.category] ??= []).push(check);
      return acc;
    },
    {}
  );

  return (
    <details open className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
      <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors list-none">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono font-semibold text-green-700">
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
          className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="border-t border-gray-100">
        {/* Standard checks by category */}
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

        {/* Custom checks */}
        {page.custom.length > 0 && (
          <div>
            <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
              Custom checks
            </p>
            <div className="divide-y divide-gray-100">
              {page.custom.map((check) => (
                <CustomCheckRow key={check.checkId} check={check} />
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function CheckRow({ check }: { check: StandardCheckResult }) {
  return (
    <div className="px-5 py-3.5 flex items-start gap-4">
      <StatusIcon status={check.status} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{check.label}</p>
        <p className="text-sm text-gray-600 mt-0.5">{check.message}</p>
        {check.details && (
          <details className="mt-1.5">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              Details
            </summary>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-1 overflow-x-auto">
              {JSON.stringify(check.details, null, 2)}
            </pre>
          </details>
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

function StatusIcon({ status }: { status: CheckStatus | "error" }) {
  if (status === "pass")
    return (
      <span className="mt-0.5 text-green-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    );
  if (status === "fail" || status === "error")
    return (
      <span className="mt-0.5 text-red-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </span>
    );
  if (status === "warn")
    return (
      <span className="mt-0.5 text-yellow-500 shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </span>
    );
  return (
    <span className="mt-0.5 text-blue-400 shrink-0">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const map: Record<string, string> = {
    pass: "bg-green-100 text-green-700",
    warn: "bg-yellow-100 text-yellow-700",
    fail: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function ScorePill({ label, count, color }: { label: string; count: number; color: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${colors[color]}`}>
      <span className="text-lg font-bold">{count}</span>
      <span className="font-normal text-xs">{label}</span>
    </div>
  );
}

function MiniPill({ count, color }: { count: number; color: "green" | "yellow" | "red" }) {
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
