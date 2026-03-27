import { Skeleton } from "@/src/components/ui/skeleton"

export function KpiCardSkeleton() {
  return (
    // Usamos el mismo contenedor que tu KpiCard real
    <div className="bg-muted/50 rounded-lg px-4 py-3.5 flex flex-col gap-1.5">
      
      {/* Esqueleto del Label (ej: "Balance Total") */}
      <Skeleton className="h-[11px] w-24 bg-muted-foreground/20" />
      
      {/* Esqueleto del Valor (ej: "$4.850.000") */}
      <Skeleton className="h-7 w-32 bg-muted-foreground/10" />
      
      {/* Contenedor inferior (Subtitle + TrendBadge) */}
      <div className="flex items-center justify-between gap-2 min-h-[18px] mt-1">
        {/* Esqueleto del Subtitle */}
        <Skeleton className="h-[9px] w-16 bg-muted-foreground/10" />
        
        {/* Esqueleto del TrendBadge redondo */}
        <Skeleton className="h-4 w-10 rounded-full bg-muted-foreground/10" />
      </div>
    </div>
  )
}

export function KpiGridSkeleton({ className, count = 4 }: { className?: string; count?: number }) {
  return (
    <div className={`grid gap-2.5 ${className ?? ""}`}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  )
}