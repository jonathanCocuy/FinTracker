"use client"

import { useI18n } from "@/src/lib/i18n"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"

interface DonutData {
  name: string
  value: number
  color: string
}

interface CategoryDonutProps {
  data: DonutData[]
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  const { t } = useI18n()
  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  const formattedTotal = (value: number) => {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'decimal', // Cambiado de 'currency' a 'decimal'
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(value);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="h-[250px] w-full relative">
        {/* Truco Pro: Texto en el centro del Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground uppercase font-semibold">{t("common.total")}</span>
          <span className="text-xl font-bold tracking-tight">
            ${Intl.NumberFormat('es-CO', { notation: 'compact' }).format(total)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70} // Grosor del anillo
              outerRadius={90}
              paddingAngle={4} // Espacio elegante entre segmentos
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                fontSize: '12px'
              }}
              itemStyle={{ fontWeight: '600' }}
              formatter={(value) => <span className="text-[11px] font-medium opacity-70">${formattedTotal(value as number)}</span>}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value) => <span className="text-[11px] font-medium opacity-70">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}