"use client"

import React from "react"
import { Bar, BarChart as ReChartsBar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

interface ChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: ChartData[]
  color?: string
}

const colorMap: Record<string, string> = {
  "var(--color-finance-income)": "var(--color-finance-income)",
  "var(--color-finance-expense)": "var(--color-finance-expense)",
  "var(--color-finance-savings)": "var(--color-finance-savings)",
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

const formatTooltip = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function BarChartComponent({ data, color = "var(--color-finance-income)" }: BarChartProps) {
  return (
    <div className="h-[250px] min-h-[250px] min-w-0 w-full p-2 pt-4 rounded-lg bg-background">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 210 }}
      >
        <ReChartsBar data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickFormatter={(value) => value.charAt(0).toUpperCase()}
            stroke="#888888"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-border)', opacity: 0.1 }}
            formatter={(value) => [formatTooltip(value as number), "$"]}
            separator=""
            contentStyle={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
              padding: '10px 16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            itemStyle={{
              color: 'var(--color-foreground)',
              fontWeight: '700',
              fontSize: '16px',
              padding: '0',
              textAlign: 'center',
            }}
            labelStyle={{
              color: 'var(--color-foreground)',
              marginBottom: '2px',
              fontSize: '11px',
              opacity: 0.5,
              fontWeight: '500',
              textAlign: 'center',
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]} 
            barSize={50}
            // --- CONFIGURACIÓN DE ANIMACIÓN ---
            isAnimationActive={true} 
            animationBegin={200}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colorMap[color] || color}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </ReChartsBar>
      </ResponsiveContainer>
    </div>
  )
}