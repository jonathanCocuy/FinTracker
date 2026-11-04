import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"

function InvestmentRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card px-4 py-3 flex items-center gap-4">
      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="text-right flex flex-col gap-1.5 shrink-0">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-2.5 w-10 ml-auto" />
      </div>
    </div>
  )
}

export default function InvestmentsLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <NavbarSkeleton />

      <div className="flex items-center justify-between w-full px-2 pt-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Row list */}
      <div className="flex flex-col gap-2 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <InvestmentRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
