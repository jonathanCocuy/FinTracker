import { NavbarSkeleton } from "@/src/components/dashboard/navbar-loading"
import { Skeleton } from "@/src/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <NavbarSkeleton />

      <main className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8 w-full">
        <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-zinc-900/50 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Skeleton className="h-28 w-28 rounded-full shrink-0" />
            <Skeleton className="h-10 w-52" />
          </div>
        </section>

        <div className="bg-zinc-900/30 border border-white/5 rounded-[28px] p-6 space-y-6">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-white/5 rounded-[28px] p-6 space-y-6">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-40 rounded-xl" />
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-2.5 w-56" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  )
}
