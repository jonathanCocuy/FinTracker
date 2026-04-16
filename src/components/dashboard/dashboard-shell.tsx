"use client"

import { useState } from "react"
import { useI18n } from "@/src/lib/i18n"
import { BarChartComponent } from "./bar-chart"
import { KpiGrid, type KpiItem } from "./kpi-cards"
import { CategoryDonut } from "./category-donut"
import { createColumns } from "./columns"
import { TransactionTable } from "./transaction-table"
import { TransactionModal } from "./transaction-modal"
import { AccountGrid } from "./account-card"
import { EmptyState } from "@/src/components/ui/empty-state"
import { ArrowUpRight, Wallet } from "lucide-react"
import { Navbar } from "@/src/components/navbar"
import { AccountModal } from "@/src/components/dashboard/account-modal"
import type { DashboardData, DashboardTransaction } from "@/src/lib/data"

const WEEKDAY_KEYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const

const CATEGORY_COLORS: Record<string, string> = {
  food: "#fbbf24",
  transport: "#3b82f6",
  housing: "#f43f5e",
  subscriptions: "#10b981",
  leisure: "#a855f7",
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const { t } = useI18n()
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<DashboardTransaction | null>(null)
  const [createAccountOpen, setCreateAccountOpen] = useState(false)

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

  const barChartData = data.barChartData.map(({ dayIndex, value }) => ({
    label: t(`weekdays.${WEEKDAY_KEYS[dayIndex]}`),
    value,
  }))

  const donutData = data.donutData.map(({ category, value }) => ({
    name: t(`categories.${category}`),
    value,
    color: CATEGORY_COLORS[category] ?? "#6b7280",
  }))

  const columns = createColumns(t)

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
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 w-full">
            <div className="flex flex-col gap-4 items-center justify-center w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.dayChart")}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <div className="w-full h-[300px]">
                <BarChartComponent data={barChartData} color="var(--color-finance-expense)" />
              </div>
            </div>

            {/* Donut Section */}
            <div className="flex flex-col gap-4 items-center justify-center w-full min-w-0">
              <div className="w-full flex flex-col gap-2 mt-4 px-2">
                <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  {t("dashboard.categoryChart") || "Category Chart"}
                </p>
                <div className="h-1 w-full bg-linear-to-r from-border/50 via-border to-transparent" />
              </div>
              <div className="w-full h-[300px]">
                <CategoryDonut data={donutData} />
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="flex flex-col gap-4 items-left w-full">
            <div className="w-full flex flex-col gap-4 overflow-x-auto">
              <div className="flex flex-row justify-between items-center w-full pr-2">
                <div className="w-full flex flex-col gap-2 mt-4 px-2">
                  <p className="text-[14px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {t("dashboard.transactionsTitle")}
                  </p>
                  
                  <div className="h-1 w-full bg-linar-to-r from-border/50 via-border to-transparent" />
                </div>
                <TransactionModal />
              </div>
              {data.transactions.length > 0 ? (
                <TransactionTable
                  columns={columns}
                  data={data.transactions}
                  hoveredAccountId={hoveredAccountId}
                  onRowClick={(row) => setEditingTransaction(row as DashboardTransaction)}
                />
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
