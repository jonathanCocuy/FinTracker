"use client"

import { useState } from "react"
import { CheckCircle2, Circle, X, Wallet, ArrowRight, PiggyBank, Target } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/src/lib/i18n"
import { cn } from "@/src/lib/utils"

interface Props {
  hasAccounts: boolean
  hasTransactions: boolean
  hasBudgets: boolean
  hasGoals: boolean
}

const DISMISS_KEY = "flowx-onboarding-dismissed"

export function OnboardingChecklist({ hasAccounts, hasTransactions, hasBudgets, hasGoals }: Props) {
  const { t } = useI18n()

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem(DISMISS_KEY) === "true"
    } catch {
      return false
    }
  })

  const steps = [
    {
      key: "account",
      done: hasAccounts,
      label: t("onboarding.stepAccount"),
      href: null, // opens modal via dashboard CTA
      Icon: Wallet,
    },
    {
      key: "transaction",
      done: hasTransactions,
      label: t("onboarding.stepTransaction"),
      href: null, // press N or the + button
      Icon: ArrowRight,
    },
    {
      key: "budget",
      done: hasBudgets,
      label: t("onboarding.stepBudget"),
      href: "/budgets",
      Icon: PiggyBank,
    },
    {
      key: "goal",
      done: hasGoals,
      label: t("onboarding.stepGoal"),
      href: "/goals",
      Icon: Target,
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length

  if (dismissed || allDone) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "true") } catch {}
    setDismissed(true)
  }

  return (
    <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-aeonik-bold text-sm">{t("onboarding.title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("onboarding.progress")
            .replace("{{done}}", String(doneCount))
            .replace("{{total}}", String(steps.length))}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map(({ key, done, label, href, Icon }) => {
          const inner = (
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {done
                ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                : <Circle size={18} className="text-muted-foreground/40 shrink-0" />
              }
              <span className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>
                {label}
              </span>
              {!done && <Icon size={14} className="ml-auto text-muted-foreground/40" />}
            </div>
          )

          if (href && !done) {
            return (
              <Link key={key} href={href} className="block">
                {inner}
              </Link>
            )
          }
          return <div key={key}>{inner}</div>
        })}
      </div>

      <button onClick={dismiss} className="text-xs text-muted-foreground/60 hover:text-muted-foreground self-end transition-colors">
        {t("onboarding.dismiss")}
      </button>
    </div>
  )
}
