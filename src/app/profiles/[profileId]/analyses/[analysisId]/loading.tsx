import { Skeleton } from "@/components/skeleton";

export default function AnalysisLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-28 mb-4" />
      <div className="mt-3 mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Score pills */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      {/* Page result cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4">
              <Skeleton className="h-5 w-48" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
