import { Skeleton } from "@/src/components/ui/skeleton"

export function BarChartSkeleton() {
  return (
    <div className="h-[250px] p-2 pt-6 rounded-lg bg-background border-border border-2 flex flex-col justify-between">
      {/* Simulación del área del gráfico con barras de diferentes alturas */}
      <div className="flex items-end justify-around h-[180px] w-full px-4 gap-2">
        {[60, 100, 40, 80, 50, 90, 70].map((height, i) => (
          <Skeleton 
            key={i} 
            className="w-full max-w-[30px] rounded-t-sm bg-muted/40 animate-pulse" 
            style={{ height: `${height}%` }} 
          />
        ))}
      </div>

      {/* Simulación del eje X (etiquetas de días) */}
      <div className="flex justify-around w-full mt-4 pb-2 px-4">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
          <Skeleton key={i} className="h-2 w-4 bg-muted/30" />
        ))}
      </div>
    </div>
  )
}