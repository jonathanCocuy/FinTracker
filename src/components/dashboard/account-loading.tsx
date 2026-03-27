import { Skeleton } from "@/src/components/ui/skeleton"

export function AccountCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4">
      {/* Esqueleto del Icono cuadrado */}
      <Skeleton className="h-8 w-8 rounded-lg bg-muted/50 shrink-0" />

      <div className="flex flex-col gap-1.5 min-w-0 w-full">
        {/* Esqueleto del nombre de la cuenta (Nequi, etc) */}
        <Skeleton className="h-[10px] w-12 bg-muted/40" />
        {/* Esqueleto del monto */}
        <Skeleton className="h-4 w-20 bg-muted/60" />
      </div>
    </div>
  )
}

export function AccountGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
      
      {/* Esqueleto del botón "Nueva Cuenta" para mantener el layout */}
      <Skeleton className="h-[66px] w-full rounded-xl border-2 border-dashed border-border/20 bg-transparent" />
    </div>
  )
}