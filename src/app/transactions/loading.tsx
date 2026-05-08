import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"
import { TransactionTableSkeleton } from "@/src/components/dashboard/transaction-table-loading"

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <NavbarSkeleton />

      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Skeleton className="flex-1 min-w-[180px] h-9 rounded-xl" />
          <Skeleton className="h-9 w-[110px] rounded-xl" />
          <Skeleton className="h-9 w-[160px] rounded-xl" />
          <Skeleton className="h-9 w-[160px] rounded-xl" />
        </div>

        <TransactionTableSkeleton rows={12} />
      </div>
    </div>
  )
}
