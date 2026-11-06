"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { useProfile } from "@/src/hooks/useProfile"
import type { ReportsData } from "@/src/lib/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"

function fmt(val: number, currency: string) {
  const loc = currency === 'USD' ? 'en-US' : 'es-CO'
  if (Math.abs(val) >= 1_000_000)
    return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 1 }).format(val / 1_000_000) + 'M'
  if (Math.abs(val) >= 1_000)
    return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 0 }).format(val / 1_000) + 'K'
  return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 0 }).format(val)
}

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, currency, tIncome, tExpenses }: any) {
  if (!active || !payload?.length) return null
  const income = (payload as { dataKey: string; value: number }[]).find(p => p.dataKey === 'income')?.value ?? 0
  const expenses = (payload as { dataKey: string; value: number }[]).find(p => p.dataKey === 'expenses')?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-3 py-2.5 text-xs min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-emerald-500 shrink-0" />
          <span className="text-muted-foreground flex-1">{tIncome}</span>
          <span className="font-medium text-emerald-500 tabular-nums">{fmt(income, currency)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-rose-500 shrink-0" />
          <span className="text-muted-foreground flex-1">{tExpenses}</span>
          <span className="font-medium text-rose-500 tabular-nums">{fmt(expenses, currency)}</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  data: ReportsData
}

export function ReportsShell({ data }: Props) {
  const { t, locale, tCategory } = useI18n()
  const { profile } = useProfile()
  const currency = profile?.base_currency ?? 'COP'
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState(String(data.year))

  const handleYearChange = (y: string) => {
    setSelectedYear(y)
    router.push(`/reports?year=${y}`)
  }

  const monthLabels = MONTH_KEYS.map((_, i) =>
    new Date(2024, i, 1).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { month: 'short' })
  )

  const chartData = data.monthly.map((row, i) => ({
    name: monthLabels[i],
    income: row.income,
    expenses: row.expenses,
  }))

  const kpis = [
    {
      label: t('reports.totalIncome'),
      value: data.totalIncome,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('reports.totalExpenses'),
      value: data.totalExpenses,
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      label: t('reports.netSavings'),
      value: data.totalSavings,
      icon: PiggyBank,
      color: data.totalSavings >= 0 ? 'text-blue-500' : 'text-orange-500',
      bg: data.totalSavings >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
    },
    {
      label: t('reports.savingsRate'),
      value: null,
      pct: data.savingsRate,
      icon: Wallet,
      color: data.savingsRate >= 0 ? 'text-violet-500' : 'text-orange-500',
      bg: data.savingsRate >= 0 ? 'bg-violet-500/10' : 'bg-orange-500/10',
    },
  ]

  const maxExpense = Math.max(...data.topCategories.map(c => c.total), 1)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-aeonik-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.availableYears.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, pct, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border/40 bg-card/50 p-4 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              <p className={`text-lg font-bold tracking-tight mt-0.5 ${color}`}>
                {pct !== undefined ? `${pct.toFixed(1)}%` : fmt(value!, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
        <p className="text-xs font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
          {t('reports.monthlyOverview')}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  currency={currency}
                  tIncome={t('reports.income')}
                  tExpenses={t('reports.expenses')}
                />
              )}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4, radius: 6 }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />{t('reports.income')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />{t('reports.expenses')}
          </div>
        </div>
      </div>

      {/* Monthly table + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly table */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
          <p className="text-xs font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
            {t('reports.monthlyBreakdown')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/40">
                  <th className="text-left pb-2 font-normal">{t('reports.month')}</th>
                  <th className="text-right pb-2 font-normal text-emerald-500">{t('reports.income')}</th>
                  <th className="text-right pb-2 font-normal text-rose-500">{t('reports.expenses')}</th>
                  <th className="text-right pb-2 font-normal">{t('reports.savings')}</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((row, i) => (
                  <tr key={row.month} className={`border-b border-border/20 last:border-0 ${row.income === 0 && row.expenses === 0 ? 'opacity-30' : ''}`}>
                    <td className="py-1.5 text-muted-foreground">{monthLabels[i]}</td>
                    <td className="py-1.5 text-right text-emerald-500">{fmt(row.income, currency)}</td>
                    <td className="py-1.5 text-right text-rose-500">{fmt(row.expenses, currency)}</td>
                    <td className={`py-1.5 text-right font-medium ${row.savings >= 0 ? 'text-foreground' : 'text-orange-500'}`}>
                      {fmt(row.savings, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top spending categories */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
          <p className="text-xs font-aeonik-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
            {t('reports.topCategories')}
          </p>
          {data.topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('reports.noData')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topCategories.map(cat => {
                const pct = (cat.total / maxExpense) * 100
                const catInfo = data.categories.find(c => c.name === cat.category)
                const catLabel = tCategory(cat.category, catInfo?.label ?? cat.category)
                return (
                  <div key={cat.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{catLabel}</span>
                      <span className="text-muted-foreground font-medium">{fmt(cat.total, currency)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
