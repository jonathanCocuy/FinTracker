import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"

function BudgetCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-border/50 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}

export default function BudgetsLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <NavbarSkeleton />

      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-start justify-between px-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl mt-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BudgetCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
