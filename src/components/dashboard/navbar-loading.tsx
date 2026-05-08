import { Skeleton } from "@/src/components/ui/skeleton"

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-5 w-24 hidden md:block" />
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Skeleton className="h-9 w-9 rounded-xl md:w-36" />
          <Skeleton className="h-8 w-16 rounded-md hidden sm:block" />
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
        </div>
      </div>
    </header>
  )
}
