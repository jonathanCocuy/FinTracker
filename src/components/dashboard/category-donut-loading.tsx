import { Skeleton } from "@/src/components/ui/skeleton"

export function CategoryDonutSkeleton() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="h-[250px] w-full relative flex flex-col items-center justify-center">
        
        {/* Simulación del Anillo (Donut) usando bordes redondeados */}
        <div className="relative flex items-center justify-center h-[180px] w-[180px]">
          {/* El círculo exterior con borde grueso animado */}
          <div className="absolute inset-0 rounded-full border-18 border-muted/30 animate-pulse" />
          
          {/* Texto central fantasma */}
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-2.5 w-12 bg-muted/40" />
            <Skeleton className="h-5 w-20 bg-muted/60" />
          </div>
        </div>

        {/* Simulación de la Leyenda (Legend) en la parte inferior */}
        <div className="flex justify-center gap-4 mt-6 w-full px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-muted/40" />
              <Skeleton className="h-2 w-10 bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}