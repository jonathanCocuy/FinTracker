"use client"

import { useState, useTransition } from "react"
import { Navbar } from "@/src/components/navbar"
import { Progress } from "@/src/components/ui/progress"
import { Button } from "@/src/components/ui/button"
import { useI18n } from "@/src/lib/i18n"
import { deleteBudget } from "@/src/lib/actions"
import { BudgetModal, CATEGORY_ICONS, BUDGET_CATEGORIES } from "./budget-modal"
import type { BudgetsPageData, BudgetWithProgress } from "@/src/lib/data"
import { Plus, Pencil, Trash2, Target, Package } from "lucide-react"
import { cn } from "@/src/lib/utils"

const DEFAULT_ICON = <Package size={20} />

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-rose-500"
  if (pct >= 80) return "bg-amber-500"
  return "bg-emerald-500"
}

function BudgetCard({
  budget,
  onEdit,
  t,
}: {
  budget: BudgetWithProgress
  onEdit: () => void
  t: (key: string) => string
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pct = Math.min(budget.percentage, 100)

  function handleDelete() {
    startTransition(async () => {
      await deleteBudget(budget.id)
      setConfirmDelete(false)
    })
  }

  return (
    <div className={cn(
      "relative flex flex-col gap-3 p-5 rounded-2xl border bg-card transition-all duration-200",
      budget.isOverBudget
        ? "border-rose-500/30 bg-rose-500/5"
        : "border-border/50 hover:border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            budget.isOverBudget
              ? "bg-rose-500/15 text-rose-500"
              : "bg-muted text-muted-foreground"
          )}>
            {CATEGORY_ICONS[budget.category] ?? DEFAULT_ICON}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{t(`categories.${budget.category}`)}</span>
            <span className="text-xs text-muted-foreground">
              {fmtCurrency(budget.spent)} {t("budgets.spentOf")} {fmtCurrency(budget.monthly_limit)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil size={13} />
          </Button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                disabled={isPending}
                onClick={handleDelete}
              >
                {isPending ? "..." : t("common.delete")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 rounded-lg text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={pct}
        className="h-2"
        indicatorClassName={progressColor(budget.percentage)}
      />

      {/* Status line */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs font-bold",
          budget.isOverBudget ? "text-rose-500" : "text-emerald-500"
        )}>
          {budget.isOverBudget
            ? `${t("budgets.overspent")} ${fmtCurrency(Math.abs(budget.remaining))}`
            : `${t("budgets.remaining")} ${fmtCurrency(budget.remaining)}`
          }
        </span>
        <span className={cn(
          "text-xs font-black tabular-nums",
          budget.percentage >= 100
            ? "text-rose-500"
            : budget.percentage >= 80
              ? "text-amber-500"
              : "text-muted-foreground/60"
        )}>
          {Math.round(budget.percentage)}%
        </span>
      </div>
    </div>
  )
}

export function BudgetsShell({ data }: { data: BudgetsPageData }) {
  const { t } = useI18n()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null)

  const usedCategories = data.budgets.map(b => b.category)
  const canAddMore = usedCategories.length < BUDGET_CATEGORIES.length

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />

      <div className="flex flex-col gap-6 w-full">
        {/* Header */}
        <div className="flex items-start justify-between px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{t("budgets.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("budgets.subtitle")}</p>
          </div>
          {canAddMore && (
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="rounded-xl gap-1.5 shrink-0 mt-1"
            >
              <Plus size={14} />
              {t("budgets.addBudget")}
            </Button>
          )}
        </div>

        {/* Budget grid */}
        {data.budgets.length === 0 ? (
          <div className="w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Target size={28} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold">{t("budgets.empty")}</p>
              <p className="text-sm text-muted-foreground max-w-sm">{t("budgets.emptyDescription")}</p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-2 rounded-xl px-6 font-semibold"
            >
              <Plus size={14} className="mr-1.5" />
              {t("budgets.addBudget")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={() => setEditingBudget(budget)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        usedCategories={usedCategories}
      />
      {editingBudget && (
        <BudgetModal
          open={true}
          onOpenChange={open => { if (!open) setEditingBudget(null) }}
          existingBudget={editingBudget}
          usedCategories={usedCategories}
        />
      )}
    </div>
  )
}
