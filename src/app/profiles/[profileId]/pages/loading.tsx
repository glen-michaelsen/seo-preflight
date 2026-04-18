import { Skeleton } from "@/components/skeleton";

export default function PagesLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-96 mb-8" />

      {/* Group cards */}
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="px-5 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                <Skeleton className="h-4 w-48 font-mono" />
                <Skeleton className="h-4 w-32" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
