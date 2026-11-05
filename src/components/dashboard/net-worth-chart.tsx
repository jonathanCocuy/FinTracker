"use client"

import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useI18n } from "@/src/lib/i18n"
import { useProfile } from "@/src/hooks/useProfile"
import type { NetWorthPoint } from "@/src/lib/data"
import { TrendingUp, TrendingDown } from "lucide-react"

function fmtDate(dateStr: string, locale: string) {
  const [year, month] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { month: 'short', year: '2-digit' })
}

function fmtCurrency(val: number, currency: string) {
  const loc = currency === 'USD' ? 'en-US' : 'es-CO'
  if (Math.abs(val) >= 1_000_000) {
    return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 0 })
      .format(val / 1_000_000) + 'M'
  }
  if (Math.abs(val) >= 1_000) {
    return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 0 })
      .format(val / 1_000) + 'K'
  }
  return new Intl.NumberFormat(loc, { style: 'currency', currency, maximumFractionDigits: 0 }).format(val)
}

interface Props {
  data: NetWorthPoint[]
}

export function NetWorthChart({ data }: Props) {
  const { t, locale } = useI18n()
  const { profile } = useProfile()
  const currency = profile?.base_currency ?? 'COP'

  const chartData = useMemo(() =>
    data.map(p => ({
      label: fmtDate(p.date, locale),
      value: p.net_worth,
      date: p.date,
    })),
    [data, locale]
  )

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-1">
        <TrendingUp size={20} className="opacity-40" />
        <span>{t('netWorth.notEnoughData')}</span>
      </div>
    )
  }

  const first = data[0].net_worth
  const last = data[data.length - 1].net_worth
  const change = last - first
  const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : 0
  const isUp = change >= 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight">
            {fmtCurrency(last, currency)}
          </span>
          <span className="text-xs text-muted-foreground">{t('netWorth.currentNetWorth')}</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? '+' : ''}{changePct.toFixed(1)}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              padding: '6px 10px',
            }}
            formatter={(value) => [fmtCurrency(Number(value), currency), t('netWorth.netWorth')]}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 2 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isUp ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            fill="url(#nwGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
