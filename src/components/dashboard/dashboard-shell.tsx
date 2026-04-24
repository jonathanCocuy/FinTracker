"use client"

import { useState } from "react"
import { useI18n } from "@/src/lib/i18n"
import { KpiGrid, type KpiItem } from "./kpi-cards"
import { CategoryDonut } from "./category-donut"
import { IncomeExpenseChart } from "./income-expense-chart"
import { MonthStats } from "./month-stats"
import { createColumns } from "./columns"
import { TransactionTable } from "./transaction-table"
import { TransactionModal } from "./transaction-modal"
import { AccountGrid } from "./account-card"
import { EmptyState } from "@/src/components/ui/empty-state"
import * as LucideIcons from "lucide-react"
import { ArrowUpRight, Wallet, AlertTriangle, CheckCircle2, ChevronRight, Target } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/src/components/navbar"
import { AccountModal } from "@/src/components/dashboard/account-modal"
import { ExportMenu } from "@/src/components/dashboard/export-menu"
import { Progress } from "@/src/components/ui/progress"
import type { DashboardData, DashboardTransaction } from "@/src/lib/data"
import { cn } from "@/src/lib/utils"

export function DashboardShell({ data }: { data: DashboardData }) {
  const { t, locale } = useI18n()
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<DashboardTransaction | null>(null)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)

  const categoryColorMap: Record<string, string> = Object.fromEntries(
    data.categories.map(c => [c.name, c.color])
  )

  const hasAccounts = data.accounts.length > 0

  const firstName = data.profile?.full_name?.split(" ")[0] || "..."

  const kpis: KpiItem[] = [
    {
      label: t("kpis.balanceTotal"),
      value: data.totalBalance,
      previousValue: data.prevTotalBalance,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "default",
    },
    {
      label: t("kpis.incomeMonth"),
      value: data.currentMonthIncome,
      previousValue: data.prevMonthIncome,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "income",
    },
    {
      label: t("kpis.expensesMonth"),
      value: data.currentMonthExpenses,
      previousValue: data.prevMonthExpenses,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "expense",
    },
    {
      label: t("kpis.savingsGoal"),
      value: data.currentMonthIncome - data.currentMonthExpenses,
      previousValue: data.prevMonthIncome - data.prevMonthExpenses,
      subtitle: t("dashboard.vsPreviousMonth"),
      color: "savings",
    },
  ]

  const dateLocale = locale === "en" ? "en-US" : "es-CO"

  const incomeVsExpensesWeekly = data.incomeVsExpensesWeekly.map(({ period, ingresos, gastos }) => ({
    label: new Date(period + "T00:00:00Z").toLocaleDateString(dateLocale, {
      weekday: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    ingresos,
    gastos,
  }))

  const incomeVsExpensesMonthly = data.incomeVsExpensesMonthly.map(({ period, ingresos, gastos }) => ({
    label: new Date(period + "T00:00:00Z").toLocaleDateString(dateLocale, {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }),
    ingresos,
    gastos,
  }))

  const donutData = data.donutData.map(({ category, value }) => {
    const cat = data.categories.find(c => c.name === category)
    return {
      name: cat?.label ?? t(`categories.${category}`),
      value,
      color: categoryColorMap[category] ?? "#6b7280",
    }
  })

  const columns = createColumns(t, data.accounts, locale, data.categories)

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />
      <div className="flex flex-col gap-4 justify-center items-left p-4 w-full max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">{t("dashboard.welcome")}, {firstName}</h1>
      </div>

      <KpiGrid data={kpis} className="grid grid-cols-2 md:grid-cols-4 w-full gap-4" />

      <AccountGrid
        accounts={data.accounts}
        onHoverAccount={setHoveredAccountId}
        hoveredAccountId={hoveredAccountId}
        showAddButton={hasAccounts}
      />

      {!hasAccounts ? (
        <>
          {/* Banner: no hay cuentas */}
          <div className="w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Wallet size={28} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold">{t("dashboard.noAccountsTitle")}</p>
              <p className="text-sm text-muted-foreground max-w-sm">{t("dashboard.noAccountsDescription")}</p>
            </div>
            <button
              onClick={() => setCreateAccountOpen(true)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t("dashboard.noAccountsCta")}
            </button>
          </div>

          <AccountModal
            open={createAccountOpen}
            onOpenChange={setCreateAccountOpen}
          />
        </>

      ) : (
        <>
          {/* Income vs Expenses Chart */}
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-col gap-2 mt-4 px-2">
              <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                {t("dashboard.incomeVsExpensesChart")}
              </p>
              <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
            </div>
            <IncomeExpenseChart
              weeklyData={incomeVsExpensesWeekly}
              monthlyData={incomeVsExpensesMonthly}
              labelIncome={t("transactionModal.income")}
              labelExpense={t("transactionModal.expense")}
              labelWeekly={t("dashboard.weekly")}
              labelMonthly={t("dashboard.monthly")}
            />
          </div>

          {/* Donut + Recent Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex flex-col gap-4 w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.categoryChart")}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <div className="w-full h-[280px]">
                <CategoryDonut data={donutData} />
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.monthStats")}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <MonthStats stats={data.monthStats} t={t} locale={locale} />
            </div>
          </div>

          {/* Budget & Goals Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Budget Widget */}
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("budgets.widget")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <Link
                  href="/budgets"
                  className="group w-full rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200 flex flex-col flex-1"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {data.budgetAlerts.some(b => b.isOver) ? (
                          <AlertTriangle size={15} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        )}
                        <span className="text-sm font-semibold">
                          {data.budgetAlerts.some(b => b.isOver)
                            ? t("budgets.overBudget")
                            : t("budgets.onTrack")}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {t("budgets.widgetLink")}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  {data.budgetAlerts.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {data.budgetAlerts.slice(0, 3).map(alert => (
                        <div key={alert.category} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">
                            {t(`categories.${alert.category}`)}
                          </span>
                          <Progress
                            value={Math.min(alert.percentage, 100)}
                            className="flex-1 h-1.5"
                            indicatorClassName={cn(
                              alert.isOver ? "bg-rose-500" : alert.percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                          />
                          <span className={cn(
                            "text-xs font-bold tabular-nums w-10 text-right shrink-0",
                            alert.isOver ? "text-rose-500" : alert.percentage >= 80 ? "text-amber-500" : "text-muted-foreground/60"
                          )}>
                            {Math.round(alert.percentage)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("budgets.widgetEmpty")}</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        {t("budgets.widgetEmptyCta")}
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  )}
                  </div>
                </Link>
              </div>
            {/* Goals Widget */}
            {data.topGoals.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("goals.title")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <Link
                  href="/goals"
                  className="group w-full rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200 flex flex-col flex-1"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-500">
                        <Target size={15} />
                        <span className="text-sm font-semibold">
                          {t("goals.title")}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {t("dashboard.viewAll")}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {data.topGoals.map(goal => {
                        const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
                        return (
                          <div key={goal.id} className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24 shrink-0 truncate">
                              {(() => {
                                const name = goal.icon
                                const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name] : null
                                return Icon
                                  ? <Icon size={12} className="text-muted-foreground shrink-0" />
                                  : <span className="text-xs shrink-0">{goal.icon || '🎯'}</span>
                              })()}
                              <span className="text-xs text-muted-foreground truncate">{goal.name}</span>
                            </div>
                            <Progress
                              value={percentage}
                              className="flex-1 h-1.5"
                              indicatorClassName="bg-blue-500"
                            />
                            <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0 text-blue-500">
                              {percentage}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Link>
              </div>
            ) : <div />}
          </div>

          {/* Transactions Section */}
          <div className="flex flex-col gap-4 items-left w-full">
            <div className="w-full flex flex-col gap-4 overflow-x-auto">
              <div className="flex flex-row justify-between items-center w-full pr-2">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("dashboard.transactionsTitle")}
                  </p>
                  <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TransactionModal />
                </div>
              </div>
              {data.transactions.length > 0 ? (
                <>
                  <TransactionTable
                    columns={columns}
                    data={data.transactions.slice(0, 5)}
                    hoveredAccountId={hoveredAccountId}
                    onRowClick={(row) => setEditingTransaction(row as DashboardTransaction)}
                  />
                  <div className="flex justify-end pr-1">
                    <Link
                      href="/transactions"
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {t("dashboard.viewAll")}
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-md border bg-card p-12 flex flex-col items-center justify-center text-center">
                  <EmptyState icon={ArrowUpRight} title={t("dashboard.noTransactions")} />
                </div>
              )}
            </div>
          </div>

          {editingTransaction && (
            <TransactionModal
              transaction={editingTransaction}
              open={true}
              onOpenChange={(open) => { if (!open) setEditingTransaction(null) }}
            />
          )}
        </>
      )}
    </div>
  )
}
