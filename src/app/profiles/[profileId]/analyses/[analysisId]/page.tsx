import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { AnalysisResults, PageResult } from "@/types/analysis";
import AnalysisResultsClient from "@/components/analysis-results-client";

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

  // Aggregate totals across all pages (check-level, for header pills)
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
            else if (c.status === "fail" || c.status === "error") acc.fail++;
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
        className="text-sm text-gray-500 hover:text-gtc-green transition-colors"
      >
        ← {profile.name}
      </Link>

      <div className="mt-3 mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis results</h1>
          {results && (
            <p className="text-sm text-gray-500 mt-1">
              {results.pages.length} page{results.pages.length !== 1 ? "s" : ""}{" "}
              · {new Date(results.analyzedAt).toLocaleString("en-GB")}
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
        <AnalysisResultsClient pagesByGroup={pagesByGroup} />
      )}
    </div>
  );
}

function ScorePill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${colors[color]}`}
    >
      <span className="text-lg font-bold">{count}</span>
      <span className="font-normal text-xs">{label}</span>
    </div>
  );
}
