import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div>
      {/* Header */}
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Summary card */}
      <div className="mb-8 bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* History table */}
      <Skeleton className="h-6 w-36 mb-4" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 flex gap-8">
          {["w-14", "w-32", "w-10", "w-12", "w-16"].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-gray-100 last:border-0 flex gap-8 items-center">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-8 ml-auto" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
