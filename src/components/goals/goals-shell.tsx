"use client"

import { useState } from "react"
import { useI18n } from "@/src/lib/i18n"
import { Navbar } from "@/src/components/navbar"
import { GoalCard } from "@/src/components/goals/goal-card"
import { GoalModal } from "@/src/components/goals/goal-modal"
import { ContributeModal } from "@/src/components/goals/contribute-modal"
import type { SavingsGoal, DashboardAccount } from "@/src/lib/data"
import { Target, Plus } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export function GoalsShell({
  goals,
  accounts
}: {
  goals: SavingsGoal[],
  accounts: DashboardAccount[]
}) {
  const { t } = useI18n()
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>()

  const [contributeModalOpen, setContributeModalOpen] = useState(false)
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | undefined>()

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setGoalModalOpen(true)
  }

  const handleContribute = (goal: SavingsGoal) => {
    setActiveGoal(goal)
    setContributeModalOpen(true)
  }

  const handleCloseGoalModal = (open: boolean) => {
    setGoalModalOpen(open)
    if (!open) setEditingGoal(undefined)
  }

  const handleCloseContributeModal = (open: boolean) => {
    setContributeModalOpen(open)
    if (!open) setActiveGoal(undefined)
  }

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto pb-20">
      <Navbar />

      <div className="w-full flex items-start justify-between px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t("goals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Button
          onClick={() => setGoalModalOpen(true)}
          size="sm"
          className="rounded-xl gap-1.5 shrink-0 mt-1"
        >
          <Plus size={14} />
          {t("goals.addGoal")}
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="w-full mt-8 rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
          <div className="p-4 rounded-full bg-muted">
            <Target size={28} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold">{t("goals.empty")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t("goals.emptyDescription")}</p>
          </div>
          <Button
            onClick={() => setGoalModalOpen(true)}
            size="sm"
            className="mt-2 rounded-xl"
          >
            {t("goals.addGoal")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => handleEdit(goal)}
              onContribute={() => handleContribute(goal)}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={goalModalOpen}
        onOpenChange={handleCloseGoalModal}
        goal={editingGoal}
      />

      {activeGoal && (
        <ContributeModal
          open={contributeModalOpen}
          onOpenChange={handleCloseContributeModal}
          goal={activeGoal}
          accounts={accounts}
        />
      )}
    </div>
  )
}
