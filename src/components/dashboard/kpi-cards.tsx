// components/KpiCard.tsx

export type KpiColor = "income" | "expense" | "savings" | "default"

export type KpiItem = {
  label: string
  value: number
  previousValue?: number  // si lo pasas, calcula el trend automáticamente
  subtitle?: string       // e.g. "vs febrero"
  prefix?: string
  suffix?: string
  color?: KpiColor
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const colorMap: Record<KpiColor, string> = {
  income:  "text-finance-income",
  expense: "text-finance-expense",
  savings: "text-finance-savings",
  default: "text-foreground",
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)
}

function getTrend(value: number, prev: number) {
  if (prev === 0) return { direction: "flat" as const, percent: 0 }
  const diff = ((value - prev) / Math.abs(prev)) * 100
  const percent = Math.round(Math.abs(diff))
  const direction = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat"
  return { direction: direction as "up" | "down" | "flat", percent }
}

// ─── Trend badge ──────────────────────────────────────────────────────────────

const trendStyles = {
  up:   { cls: "bg-finance-income/10 text-finance-income", arrow: "↑" },
  down: { cls: "bg-finance-expense/10 text-finance-expense", arrow: "↓" },
  flat: { cls: "bg-muted text-muted-foreground border border-border", arrow: "→" },
}

function TrendBadge({ value, prev }: { value: number; prev: number }) {
  const { direction, percent } = getTrend(value, prev)
  const { cls, arrow } = trendStyles[direction]
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
      {arrow} {percent}%
    </span>
  )
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

export function KpiCard({ item }: { item: KpiItem }) {
  const { label, value, previousValue, subtitle, prefix = "$", suffix = "", color = "default" } = item

  return (
    <div className="bg-muted/50 rounded-lg px-4 py-3.5 flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-[22px] font-medium leading-tight ${colorMap[color]}`}>
        {color === "income" ? "+" : color === "expense" ? "-" : ""}{prefix}{formatNumber(value)}{suffix}
      </p>
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/60">{subtitle}</p>
        )}
        {previousValue !== undefined && (
          <TrendBadge value={value} prev={previousValue} />
        )}
      </div>
    </div>
  )
}

// ─── KpiGrid ─────────────────────────────────────────────────────────────────

export function KpiGrid({ data, className }: { data: KpiItem[]; className?: string }) {
  return (
    <div className={`grid gap-2.5 ${className ?? ""}`}>
      {data.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  )
}