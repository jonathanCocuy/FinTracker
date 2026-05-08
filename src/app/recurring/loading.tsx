import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"

function TemplateSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-3 pl-3">
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecurringLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto pb-20">
      <NavbarSkeleton />

      <div className="w-full flex items-start justify-between px-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl mt-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <TemplateSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
