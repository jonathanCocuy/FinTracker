import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"
import { KpiGridSkeleton } from "@/src/components/dashboard/kpi-loading"
import { AccountGridSkeleton } from "@/src/components/dashboard/account-loading"
import { BarChartSkeleton } from "@/src/components/dashboard/bar-chart-loading"
import { CategoryDonutSkeleton } from "@/src/components/dashboard/category-donut-loading"
import { TransactionTableSkeleton } from "@/src/components/dashboard/transaction-table-loading"

function SectionLabel() {
  return (
    <div className="w-full flex flex-col gap-2 mt-4 px-2">
      <Skeleton className="h-3 w-36" />
      <div className="h-1 w-full bg-border/30 rounded" />
    </div>
  )
}

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <SectionLabel />
      <div className="w-full rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-2.5 w-24 shrink-0" />
              <Skeleton className="flex-1 h-1.5" />
              <Skeleton className="h-2.5 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <NavbarSkeleton />

      <div className="flex flex-col gap-4 p-4 w-full max-w-7xl mx-auto">
        <Skeleton className="h-8 w-52" />
      </div>

      <KpiGridSkeleton className="grid-cols-2 md:grid-cols-4 w-full" />

      <AccountGridSkeleton count={3} />

      <div className="w-full flex flex-col gap-4">
        <SectionLabel />
        <BarChartSkeleton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="flex flex-col gap-4 w-full min-w-0">
          <SectionLabel />
          <div className="w-full h-[280px]">
            <CategoryDonutSkeleton />
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full min-w-0">
          <SectionLabel />
          <div className="flex flex-col gap-3 px-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-row justify-between items-center w-full pr-2">
          <SectionLabel />
          <div className="flex items-center gap-2 shrink-0 mt-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
        <TransactionTableSkeleton rows={5} />
      </div>
    </div>
  )
}
