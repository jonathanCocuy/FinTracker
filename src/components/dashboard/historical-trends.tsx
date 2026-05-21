"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { IncomeExpensePoint } from "@/src/lib/data"
import { useI18n } from "@/src/lib/i18n"

interface HistoricalTrendsProps {
  data: IncomeExpensePoint[]
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

const fmtN = (v: number) =>
  new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--color-background)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
    padding: "10px 16px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  },
  itemStyle: { color: "var(--color-foreground)", fontWeight: "700", fontSize: "13px" },
  labelStyle: { color: "var(--color-foreground)", marginBottom: "4px", fontSize: "11px", opacity: 0.5 },
}

export function HistoricalTrends({ data }: HistoricalTrendsProps) {
  const { t, locale } = useI18n()
  const dateLocale = locale === "en" ? "en-US" : "es-CO"

  const chartData = data.map(({ period, ingresos, gastos }) => ({
    label: new Date(period + "T00:00:00Z").toLocaleDateString(dateLocale, {
      month: "short",
      timeZone: "UTC",
    }),
    income: ingresos,
    expenses: gastos,
    savings: ingresos - gastos,
  }))

  let cumulative = 0
  const savingsData = chartData.map(d => {
    cumulative += d.savings
    return { label: d.label, cumulative, monthly: d.savings }
  })

  const last = chartData.at(-1)
  const prev = chartData.at(-2)

  const incomeChange =
    prev && prev.income > 0 ? ((last!.income - prev.income) / prev.income) * 100 : null
  const expenseChange =
    prev && prev.expenses > 0 ? ((last!.expenses - prev.expenses) / prev.expenses) * 100 : null
  const avgSavingsRate =
    (chartData.reduce((s, d) => s + (d.income > 0 ? d.savings / d.income : 0), 0) /
      (chartData.length || 1)) *
    100

  const labelIncome = t("transactionModal.income")
  const labelExpense = t("transactionModal.expense")

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label={t("trends.incomeChange")} change={incomeChange} vsLabel={t("trends.vsLastMonth")} />
        <StatPill label={t("trends.expenseChange")} change={expenseChange} invertColors vsLabel={t("trends.vsLastMonth")} />
        <div className="rounded-xl bg-card border border-border/50 p-3 flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">{t("trends.avgSavingsRate")}</span>
          <span className="text-xl font-bold tabular-nums leading-tight">
            {avgSavingsRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground/50">{t("trends.last6Months")}</span>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bar chart: Income vs Expenses */}
        <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-4">
          <span className="text-xs font-semibold text-muted-foreground">{t("trends.incomeVsExpenses")}</span>

          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                barGap={3}
                barCategoryGap="35%"
              >
                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke="#888" dy={6} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} stroke="#888" />
                <Tooltip
                  cursor={{ fill: "var(--color-border)", opacity: 0.1 }}
                  formatter={(value, name) => [fmtN(value as number), name === "income" ? labelIncome : labelExpense]}
                  {...tooltipStyle}
                />
                <Bar dataKey="income" fill="var(--color-finance-income)" radius={[4, 4, 0, 0]}
                  isAnimationActive animationBegin={100} animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="expenses" fill="var(--color-finance-expense)" radius={[4, 4, 0, 0]}
                  isAnimationActive animationBegin={200} animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <LegendDot color="var(--color-finance-income)" label={labelIncome} />
            <LegendDot color="var(--color-finance-expense)" label={labelExpense} />
          </div>
        </div>

        {/* Area chart: Cumulative savings */}
        <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-4">
          <span className="text-xs font-semibold text-muted-foreground">{t("trends.cumulativeSavings")}</span>

          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={savingsData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendsSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke="#888" dy={6} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} stroke="#888" />
                <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value) => [fmtN(value as number), t("trends.cumulativeSavings")]}
                  {...tooltipStyle}
                />
                <Area
                  dataKey="cumulative"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#trendsSavingsGrad)"
                  dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
                  isAnimationActive
                  animationBegin={150}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <LegendDot color="#6366f1" label={t("trends.cumulativeSavings")} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({
  label,
  change,
  invertColors = false,
  vsLabel,
}: {
  label: string
  change: number | null
  invertColors?: boolean
  vsLabel: string
}) {
  const value = change ?? 0

  const isGood = invertColors ? value <= 0 : value >= 0
  const Icon = Math.abs(value) < 0.05 ? Minus : value > 0 ? TrendingUp : TrendingDown
  const colorClass =
    Math.abs(value) < 0.05 ? "text-muted-foreground" : isGood ? "text-emerald-500" : "text-rose-500"

  return (
    <div className="rounded-xl bg-card border border-border/50 p-3 flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className={`flex items-center gap-1 leading-tight ${colorClass}`}>
        <Icon size={14} />
        <span className="text-xl font-bold tabular-nums">
          {value > 0 ? "+" : ""}
          {value.toFixed(1)}%
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/50">{vsLabel}</span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
