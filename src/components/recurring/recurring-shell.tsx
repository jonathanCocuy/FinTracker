"use client"

import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { Repeat, Plus } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { Navbar } from "@/src/components/navbar"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { RecurringModal } from "@/src/components/recurring/recurring-modal"
import { toggleRecurringTemplate } from "@/src/lib/actions"
import type { RecurringTemplate, RecurringPageData, DashboardAccount, UserCategory } from "@/src/lib/data"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

function intervalLabel(t: RecurringTemplate): string {
  if (t.interval === "monthly") {
    return `Mensual · el ${t.day_of_month} de cada mes`
  }
  return `Semanal · cada ${DAY_NAMES_ES[t.day_of_week ?? 0]}`
}

function nextOccurrence(t: RecurringTemplate): string {
  const today = new Date()
  let next: Date

  if (t.interval === "monthly") {
    const day = t.day_of_month ?? 1
    next = new Date(today.getFullYear(), today.getMonth(), day)
    if (next <= today) next.setMonth(next.getMonth() + 1)
  } else {
    const target = t.day_of_week ?? 1
    const diff = (target - today.getDay() + 7) % 7 || 7
    next = new Date(today)
    next.setDate(today.getDate() + diff)
  }

  return next.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function RecurringCard({
  template,
  accounts,
  onEdit,
}: {
  template: RecurringTemplate
  accounts: DashboardAccount[]
  onEdit: (t: RecurringTemplate) => void
}) {
  const [active, setActive] = useState(template.is_active)

  const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[template.icon] ?? Repeat

  const accountName = accounts.find(a => a.id === template.account_id)?.name ?? "—"

  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(template.amount)

  async function handleToggle(checked: boolean) {
    setActive(checked)
    const result = await toggleRecurringTemplate(template.id, checked)
    if (result.error) setActive(!checked) // revert on error
  }

  return (
    <div
      onClick={() => onEdit(template)}
      className="group relative cursor-pointer rounded-2xl border border-border/50 bg-card p-4 hover:bg-muted/20 transition-all duration-200"
    >
      {/* Left accent bar colored by type */}
      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${
        template.type === "income" ? "bg-emerald-500/60" : "bg-rose-500/60"
      }`} />

      <div className="flex items-center gap-3 pl-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
          <IconComp size={16} className="text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm truncate">{template.description}</p>
            <span className={`text-sm font-black shrink-0 tabular-nums ${
              template.type === "income" ? "text-emerald-400" : "text-rose-400"
            }`}>
              {template.type === "income" ? "+" : "−"} {formatted}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1 gap-2">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">{intervalLabel(template)}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate">
                {accountName} · próxima {nextOccurrence(template)}
              </p>
            </div>
            {/* Switch: stop propagation so click doesn't open edit modal */}
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={active}
                onCheckedChange={handleToggle}
                className="scale-90 data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function RecurringShell({ templates, accounts, categories }: RecurringPageData) {
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | undefined>()

  function handleEdit(template: RecurringTemplate) {
    setEditingTemplate(template)
    setModalOpen(true)
  }

  function handleCloseModal(open: boolean) {
    setModalOpen(open)
    if (!open) setEditingTemplate(undefined)
  }

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto pb-20">
      <Navbar />

      {/* Header */}
      <div className="w-full flex items-start justify-between px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t("recurring.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("recurring.subtitle")}</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="rounded-xl gap-1.5 shrink-0 mt-1"
        >
          <Plus size={14} />
          {t("recurring.addTemplate")}
        </Button>
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="w-full mt-8 rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
          <div className="p-4 rounded-full bg-muted">
            <Repeat size={28} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold">{t("recurring.empty")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t("recurring.emptyDescription")}</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm" className="mt-2 rounded-xl">
            {t("recurring.addTemplate")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {templates.map(t => (
            <RecurringCard
              key={t.id}
              template={t}
              accounts={accounts}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <RecurringModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        template={editingTemplate}
      />
    </div>
  )
}
