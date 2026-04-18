import { Skeleton } from "@/components/skeleton";

export default function ChecksLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-80 mb-8" />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* Check rows */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4">
            <Skeleton className="w-10 h-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
