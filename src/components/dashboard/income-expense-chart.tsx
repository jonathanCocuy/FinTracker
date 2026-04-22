"use client"

import React, { useState } from "react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

interface DataPoint {
  label: string
  ingresos: number
  gastos: number
}

interface IncomeExpenseChartProps {
  weeklyData: DataPoint[]
  monthlyData: DataPoint[]
  labelIncome: string
  labelExpense: string
  labelWeekly: string
  labelMonthly: string
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

const formatTooltip = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export function IncomeExpenseChart({
  weeklyData,
  monthlyData,
  labelIncome,
  labelExpense,
  labelWeekly,
  labelMonthly,
}: IncomeExpenseChartProps) {
  const [view, setView] = useState<"weekly" | "monthly">("monthly")
  const data = view === "weekly" ? weeklyData : monthlyData

  return (
    <div className="w-full flex flex-col gap-4 p-2 pt-4 rounded-lg bg-background">
      <div className="flex gap-1 self-end">
        <button
          onClick={() => setView("monthly")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            view === "monthly"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labelMonthly}
        </button>
        <button
          onClick={() => setView("weekly")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            view === "weekly"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labelWeekly}
        </button>
      </div>

      <div className="h-[230px] min-h-[230px] min-w-0 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 400, height: 230 }}
        >
          <BarChart
            data={data}
            margin={{ top: 4, right: 10, left: -20, bottom: 0 }}
            barCategoryGap="30%"
            barGap={4}
          >
            <XAxis
              dataKey="label"
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
              cursor={{ fill: "var(--color-border)", opacity: 0.1 }}
              formatter={(value, name) => [
                formatTooltip(value as number),
                name === "ingresos" ? labelIncome : labelExpense,
              ]}
              contentStyle={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                fontSize: "12px",
                padding: "10px 16px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              itemStyle={{
                color: "var(--color-foreground)",
                fontWeight: "700",
                fontSize: "14px",
              }}
              labelStyle={{
                color: "var(--color-foreground)",
                marginBottom: "4px",
                fontSize: "11px",
                opacity: 0.5,
                fontWeight: "500",
              }}
            />
            <Legend
              formatter={(value) =>
                value === "ingresos" ? labelIncome : labelExpense
              }
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <Bar
              dataKey="ingresos"
              fill="var(--color-finance-income)"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationBegin={100}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="gastos"
              fill="var(--color-finance-expense)"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationBegin={200}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
