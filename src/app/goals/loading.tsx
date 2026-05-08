import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"

function GoalCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-5 flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function GoalsLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto pb-20">
      <NavbarSkeleton />

      <div className="w-full flex items-start justify-between px-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl mt-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
