"use client"

import * as LucideIcons from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import type { SavingsGoal } from "@/src/lib/data"
import { Calendar, Plus, Edit3, CheckCircle2 } from "lucide-react"
import { cn } from "@/src/lib/utils"

function GoalIcon({ icon, className }: { icon: string | null; className?: string }) {
  if (!icon) return <LucideIcons.Target className={className} />
  const LucideIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon]
  if (LucideIcon) return <LucideIcon className={className} />
  // Fallback: render as emoji text
  return <span className="text-2xl leading-none">{icon}</span>
}

export function GoalCard({
  goal,
  onEdit,
  onContribute
}: {
  goal: SavingsGoal
  onEdit: () => void
  onContribute: () => void
}) {
  const { t, locale } = useI18n()

  const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
  const isAchieved = percentage >= 100
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    const formatted = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", {
      month: "short",
      year: "numeric"
    }).format(date)
    return t("goals.deadlineFormat").replace("{{date}}", formatted)
  }

  return (
    <div className="relative group flex flex-col bg-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden">

      {/* Top accent bar */}
      <div className={cn(
        "h-1 w-full",
        isAchieved ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
      )} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header: Icon + Name + Edit */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
            isAchieved
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-blue-500/10 text-blue-500"
          )}>
            <GoalIcon icon={goal.icon} className="h-5 w-5" />
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-8">
            <h3 className="font-bold text-base leading-tight line-clamp-2">{goal.name}</h3>
            {goal.deadline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Calendar size={11} />
                <span>{formatDeadline(goal.deadline)}</span>
              </div>
            )}
          </div>

          <button
            onClick={onEdit}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-muted/0 text-muted-foreground hover:bg-muted hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
          >
            <Edit3 size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-medium text-muted-foreground">
              {formatCurrency(goal.current_amount)}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {formatCurrency(goal.target_amount)}
            </span>
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isAchieved
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={cn(
              "text-xs font-semibold",
              isAchieved ? "text-emerald-500" : "text-muted-foreground"
            )}>
              {isAchieved
                ? t("goals.achieved")
                : t("goals.remaining").replace("{{amount}}", formatCurrency(remaining))
              }
            </span>
            <span className={cn(
              "text-sm font-black tabular-nums",
              isAchieved ? "text-emerald-500" : "text-blue-500"
            )}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Contribute Button */}
        <button
          onClick={onContribute}
          disabled={isAchieved}
          className={cn(
            "w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200",
            isAchieved
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default"
              : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm"
          )}
        >
          {isAchieved ? (
            <>
              <CheckCircle2 size={15} strokeWidth={2.5} />
              <span>{t("goals.achieved")}</span>
            </>
          ) : (
            <>
              <Plus size={15} strokeWidth={2.5} />
              <span>{t("goals.contribute")}</span>
            </>
          )}
        </button>

      </div>
    </div>
  )
}
