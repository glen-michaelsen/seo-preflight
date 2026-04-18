import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <Skeleton className="w-full h-40 rounded-none" />
            <div className="p-4 flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5 flex gap-3">
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
