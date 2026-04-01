import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Greeting skeleton */}
      <div className="flex flex-col items-center gap-2 lg:items-start">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Chart + Activity skeleton */}
      <div className="grid gap-5 xl:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl xl:col-span-3" />
        <Skeleton className="h-72 rounded-2xl xl:col-span-2" />
      </div>
    </div>
  )
}
