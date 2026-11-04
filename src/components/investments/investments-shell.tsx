"use client"

import { useState } from "react"
import { TrendingUp, Plus, BarChart2, Zap, Landmark, Package2 } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { cn } from "@/src/lib/utils"
import { Navbar } from "@/src/components/navbar"
import { InvestmentModal } from "./investment-modal"
import type { InvestmentRecord } from "@/src/lib/data"

interface InvestmentsShellProps {
  records: InvestmentRecord[]
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  stock:  TrendingUp,
  etf:    BarChart2,
  crypto: Zap,
  fund:   Landmark,
  other:  Package2,
}

const TYPE_COLORS: Record<string, string> = {
  stock:  "#3b82f6",
  etf:    "#8b5cf6",
  crypto: "#f97316",
  fund:   "#22c55e",
  other:  "#6b7280",
}

function fmtAmount(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(value)
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function InvestmentsShell({ records }: InvestmentsShellProps) {
  const { t } = useI18n()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<InvestmentRecord | null>(null)

  const totalCOP = records.filter(r => r.currency === "COP").reduce((s, r) => s + r.amount, 0)
  const totalUSD = records.filter(r => r.currency === "USD").reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />

      {/* Header */}
      <div className="flex items-center justify-between w-full px-2 pt-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground/50 tracking-wide uppercase">{t("investments.title")}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-none mt-1">
            {t("investments.subtitle")}
          </h1>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus size={15} />
          {t("investments.addRecord")}
        </button>
      </div>

      {/* Summary KPIs */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">{t("investments.totalRecords")}</span>
            <span className="text-2xl font-bold tabular-nums">{records.length}</span>
          </div>
          {totalCOP > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{t("investments.totalCOP")}</span>
              <span className="text-lg font-bold tabular-nums leading-tight">{fmtAmount(totalCOP, "COP")}</span>
            </div>
          )}
          {totalUSD > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{t("investments.totalUSD")}</span>
              <span className="text-lg font-bold tabular-nums leading-tight">{fmtAmount(totalUSD, "USD")}</span>
            </div>
          )}
        </div>
      )}

      {/* Movement list */}
      {records.length === 0 ? (
        <div className="w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <div className="p-4 rounded-full bg-muted">
            <TrendingUp size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-bold">{t("investments.empty")}</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">{t("investments.emptyDescription")}</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("investments.addRecord")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {records.map(r => {
            const Icon = TYPE_ICONS[r.type] ?? Package2
            const hex = TYPE_COLORS[r.type] ?? "#6b7280"
            return (
              <button
                key={r.id}
                onClick={() => setEditing(r)}
                className="text-left w-full rounded-2xl border border-border/50 bg-card px-4 py-3 flex items-center gap-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group"
              >
                {/* Icon */}
                <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: hex + "22" }}>
                  <Icon size={16} style={{ color: hex }} />
                </div>

                {/* Name + type + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: hex }}>
                      {t(`investments.types.${r.type}`)}
                    </span>
                    <span className="text-[11px] text-muted-foreground/50">·</span>
                    <span className="text-[11px] text-muted-foreground/70">{fmtDate(r.date)}</span>
                  </div>
                  {r.notes && (
                    <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{r.notes}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">{fmtAmount(r.amount, r.currency)}</p>
                  <p className="text-[11px] text-muted-foreground/60">{r.currency}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <InvestmentModal open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <InvestmentModal
          record={editing}
          open={true}
          onOpenChange={(v) => { if (!v) setEditing(null) }}
        />
      )}
    </div>
  )
}
