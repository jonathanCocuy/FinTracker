"use client"

import { Calendar, TrendingUp, BarChart2 } from "lucide-react"
import type { MonthStats as MonthStatsType } from "@/src/lib/data"

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n)

interface MonthStatsProps {
  stats: MonthStatsType
  t: (key: string) => string
  locale: string
}

export function MonthStats({ stats, t, locale }: MonthStatsProps) {
  const dateLocale = locale === "en" ? "en-US" : "es-CO"

  const topDayLabel = stats.topSpendingDay
    ? new Date(stats.topSpendingDay.date + "T00:00:00Z").toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : "—"

  const items = [
    {
      Icon: Calendar,
      label: t("monthStats.topSpendingDay"),
      value: topDayLabel,
      sub: stats.topSpendingDay ? formatCOP(stats.topSpendingDay.total) : null,
    },
    {
      Icon: BarChart2,
      label: t("monthStats.avgDailyExpense"),
      value: formatCOP(stats.avgDailyExpense),
      sub: null,
    },
    {
      Icon: TrendingUp,
      label: t("monthStats.topGrowthCategory"),
      value: stats.topGrowthCategory
        ? t(`categories.${stats.topGrowthCategory.category}`)
        : "—",
      sub: stats.topGrowthCategory
        ? `+${formatCOP(stats.topGrowthCategory.growth)} ${t("monthStats.vsLastMonth")}`
        : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-full pt-2">
      {items.map(({ Icon, label, value, sub }) => (
        <div key={label} className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-muted/50 text-muted-foreground shrink-0 mt-0.5">
            <Icon size={15} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
              {label}
            </span>
            <span className="text-sm font-bold text-foreground capitalize">{value}</span>
            {sub && (
              <span className="text-xs text-muted-foreground">{sub}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
