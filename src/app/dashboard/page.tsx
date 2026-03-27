"use client"

import { useI18n } from "@/src/lib/i18n"
import { BarChartComponent } from "../../components/dashboard/bar-chart"
import { KpiGrid, type KpiItem } from "../../components/dashboard/kpi-cards"
import { CategoryDonut } from "../../components/dashboard/category-donut"
import { createColumns, Transaction } from "@/src/components/dashboard/columns"
import { TransactionTable } from "@/src/components/dashboard/transaction-table"
import { TransactionModal } from "@/src/components/dashboard/transaction-modal"
import { AccountGrid } from "@/src/components/dashboard/account-card"

export default function Dashboard() {
  const { t } = useI18n()

  const dataIncome = [
    { name: t("categories.housing"), value: 1200000, color: "#f43f5e" },
    { name: t("categories.food"), value: 850000, color: "#fbbf24" },
    { name: t("categories.transport"), value: 320000, color: "#3b82f6" },
    { name: t("categories.leisure"), value: 180000, color: "#a855f7" },
    { name: t("categories.subscriptions"), value: 95000, color: "#10b981" },
  ]

  const expensesData = [
    { label: t("weekdays.monday"), value: 100000 },
    { label: t("weekdays.tuesday"), value: 650000 },
    { label: t("weekdays.wednesday"), value: 20000 },
    { label: t("weekdays.thursday"), value: 150000 },
    { label: t("weekdays.friday"), value: 85000 },
    { label: t("weekdays.saturday"), value: 120000 },
    { label: t("weekdays.sunday"), value: 50000 },
  ]

  const transactions: Transaction[] = [
    { id: "1", date: "Hoy, 10:30", category: "food", description: "Almuerzo Ejecutivo", amount: 25000, type: "expense" },
    { id: "2", date: "Ayer, 16:15", category: "transport", description: "Uber al Centro", amount: 15000, type: "expense" },
    { id: "3", date: "15 Mar", category: "income", description: "Pago Freelance React en pago", amount: 1200000, type: "income" },
    { id: "4", date: "14 Mar", category: "subscriptions", description: "Netflix Premium", amount: 45000, type: "expense" },
    { id: "5", date: "12 Mar", category: "housing", description: "Compra Decoración", amount: 85000, type: "expense" },
  ]

  const kpis: KpiItem[] = [
    { label: t("kpis.balanceTotal"), value: 4850000, previousValue: 4200000, subtitle: t("dashboard.vsPreviousMonth"), color: "default" },
    { label: t("kpis.incomeMonth"), value: 3200000, previousValue: 2800000, subtitle: t("dashboard.vsPreviousMonth"), color: "income" },
    { label: t("kpis.expensesMonth"), value: 1450000, previousValue: 1850000, subtitle: t("dashboard.vsPreviousMonth"), color: "expense" },
    { label: t("kpis.savingsGoal"), value: 800000, previousValue: 500000, subtitle: t("dashboard.vsPreviousMonth"), color: "savings" },
  ]

  const myAccounts = [
    { id: "1", name: "Nequi", balance: 1250000, color: "bg-pink-600" },
    { id: "2", name: "NuBank", balance: 3500000, color: "bg-purple-500" },
    { id: "3", name: "Efectivo", balance: 150000, color: "bg-emerald-600" },
  ]

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("dashboard.kpisTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.kpisSubtitle")}</p>
      </div>

      {/* KPI Grid */}
      <KpiGrid data={kpis} className="grid grid-cols-2 md:grid-cols-4 w-full gap-4" />

      {/* Accounts Section */}
      <div className="flex flex-col gap-4 items-center w-full">
        <AccountGrid accounts={myAccounts} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-4 items-center justify-center w-full min-w-0">
          <h1 className="text-2xl font-bold text-center">{t("dashboard.dayChart")}</h1>
          <div className="w-full h-[300px]">
            <BarChartComponent data={expensesData} color="var(--color-finance-expense)"/>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center justify-center w-full min-w-0">
          <h1 className="text-2xl font-bold text-center">{t("dashboard.categoryChart")}</h1>
          <div className="w-full h-[300px]">
            <CategoryDonut data={dataIncome} />
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="flex flex-col gap-4 items-left w-full">
        <div className="w-full flex flex-col gap-4 sm:w-full md:w-full xl:w-[60%] 2xl:w-1/2 overflow-x-auto">
          <div className="flex flex-row justify-between items-center w-full">
            <h1 className="text-xl font-bold">{t("dashboard.transactionsTitle")}</h1>
            <TransactionModal />
          </div>
          <TransactionTable columns={createColumns(t)} data={transactions} />
        </div>
      </div>
    </div>
  )
}