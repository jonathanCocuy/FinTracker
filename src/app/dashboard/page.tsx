"use client"

import { BarChartComponent } from "../../components/dashboard/bar-chart"
import { KpiGrid, type KpiItem } from "../../components/dashboard/kpi-cards"
import { CategoryDonut } from "../../components/dashboard/category-donut"
import { columns, Transaction } from "@/src/components/dashboard/columns"
import { TransactionTable } from "@/src/components/dashboard/transaction-table"
import { TransactionModal } from "@/src/components/dashboard/transaction-modal"

const expensesData = [
  { label: "Lunes", value: 1200000 },
  { label: "Martes", value: 650000 },
  { label: "Miercoles", value: 650000 },
  { label: "Jueves", value: 150000 },
  { label: "Viernes", value: 85000 },
  { label: "Sabado", value: 120000 },
  { label: "Domingo", value: 50000 },
]

const dataIncome = [
  { name: "Vivienda", value: 1200000, color: "#f43f5e" },
  { name: "Alimentación", value: 850000, color: "#fbbf24" },
  { name: "Transporte", value: 320000, color: "#3b82f6" },
  { name: "Ocio", value: 180000, color: "#a855f7" },
  { name: "Suscripciones", value: 95000, color: "#10b981" }
]

const kpis: KpiItem[] = [
  {
    label: "Balance Total",
    value: 4850000,
    previousValue: 4200000,
    subtitle: "vs mes anterior",
    color: "default"
  },
  {
    label: "Ingresos del Mes",
    value: 3200000,
    previousValue: 2800000,
    subtitle: "vs mes anterior",
    color: "income"
  },
  {
    label: "Gastos del Mes",
    value: 1450000,
    previousValue: 1850000,
    subtitle: "vs mes anterior",
    color: "expense"
  },
  {
    label: "Meta de Ahorro",
    value: 800000,
    previousValue: 500000,
    subtitle: "vs mes anterior",
    color: "savings"
  },
]

const transactions: Transaction[] = [
  { id: "1", date: "Hoy, 10:30 AM", category: "Comida", description: "Almuerzo Ejecutivo", amount: 25000, type: "expense" },
  { id: "2", date: "Ayer, 04:15 PM", category: "Transporte", description: "Uber al Centro", amount: 15000, type: "expense" },
  { id: "3", date: "15 Mar", category: "Ingreso", description: "Pago Freelance React", amount: 1200000, type: "income" },
  { id: "4", date: "14 Mar", category: "Suscripciones", description: "Netflix Premium", amount: 45000, type: "expense" },
  { id: "5", date: "12 Mar", category: "Vivienda", description: "Compra Decoración", amount: 85000, type: "expense" },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">KPIs</h1>
        <p className="text-sm text-muted-foreground">This is a summary of your categories.</p>
      </div>

      {/* KPI Grid - Asegúrate que KpiGrid use la prop className */}
      <KpiGrid data={kpis} className="grid grid-cols-2 md:grid-cols-4 w-full gap-4" />

      {/* Charts Section - Importante el w-full */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col gap-4 items-center w-full min-w-0"> 
          <h1 className="text-2xl font-bold">Day</h1>
          <div className="w-full h-[300px]"> {/* Contenedor con altura fija para el gráfico */}
            <BarChartComponent data={expensesData} color="var(--color-finance-expense)"/>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center w-full min-w-0">
          <h1 className="text-2xl font-bold">Category</h1>
          <div className="w-full h-[300px]">
            <CategoryDonut data={dataIncome} />
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="flex flex-col gap-4 items-center w-full">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <TransactionModal />
        <div className="w-full overflow-x-auto border rounded-lg">
          <TransactionTable columns={columns} data={transactions} />
        </div>
      </div>
    </div>
  )
}