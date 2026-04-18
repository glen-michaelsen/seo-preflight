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

  // Check-level totals (used as the filter pill counts)
  const totals = results
    ? results.pages.reduce(
        (acc, page) => {
          page.standard.forEach((c) => {
            if (c.status === "pass" || c.status === "info") acc.pass++;
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

      <div className="mt-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analysis results</h1>
        {results && (
          <p className="text-sm text-gray-500 mt-1">
            {results.pages.length} page{results.pages.length !== 1 ? "s" : ""}{" "}
            · {new Date(results.analyzedAt).toLocaleString("en-GB")}
          </p>
        )}
      </div>

      {analysis.status === "ERROR" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 mb-6">
          <p className="font-semibold">Analysis failed</p>
          <p className="text-sm mt-1">{analysis.errorMessage ?? "Unknown error."}</p>
        </div>
      )}

      {results && totals && (
        <AnalysisResultsClient pagesByGroup={pagesByGroup} totals={totals} />
      )}
    </div>
  );
}
