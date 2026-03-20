"use client"

import { Bar, BarChart as ReChartsBar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

interface ChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: ChartData[]
  color?: string
}

const colorMap = {
  "var(--color-finance-income)": "var(--color-finance-income)",
  "var(--color-finance-expense)": "var(--color-finance-expense)",
  "var(--color-finance-savings)": "var(--color-finance-savings)",
}

// Función para formatear valores
const formatYAxis = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
};

const formatTooltip = (value: number) => {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'decimal', // Cambiado de 'currency' a 'decimal'
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
};

export function BarChartComponent({ data, color = "var(--color-finance-income)" }: BarChartProps) {
  return (
    <div className="h-[250px] w-[90%] md:w-[500px] lg:w-[600px] p-2 pt-4 rounded-lg bg-background border-border border-2">
      <ResponsiveContainer width="100%" height="100%">
        <ReChartsBar data={data} margin={{ top: 30, right: 10, left: 20, bottom: 20 }}>
          <XAxis
            dataKey="label"
            tickFormatter={(value) => value.charAt(0).toUpperCase()}
            stroke="#888888"
            fontSize={9}
            tickLine={false}
            axisLine={true}
            dy={15}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
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
              justifyContent: 'center',
              textAlign: 'center',
            }}
            itemStyle={{
              color: 'var(--color-foreground)',
              fontWeight: '700',
              fontSize: '16px',
              padding: '0',
              textAlign: 'center',
              display: 'block',
              width: '100%'
            }}
            labelStyle={{
              color: 'var(--color-foreground)',
              marginBottom: '2px',
              fontSize: '12px',
              opacity: 0.5,
              fontWeight: '500',
              textAlign: 'center',
              width: '100%'
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colorMap[color as keyof typeof colorMap]}
            />
          ))}
          </Bar>
        </ReChartsBar>
      </ResponsiveContainer>
    </div>
  )
}