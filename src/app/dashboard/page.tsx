"use client"

import { BarChartComponent } from "../../components/dashboard/bar-chart"
import { KpiGrid, type KpiItem } from "../../components/dashboard/kpi-cards"

const data = [
  { label: "Vivienda", value: 1200000 },
  { label: "Alimentación", value: 650000 },
  { label: "Transporte", value: 650000 },
  { label: "Ocio", value: 150000 },
  { label: "Suscripciones", value: 85000 },
  { label: "Salud", value: 120000 },
  { label: "Otros", value: 50000 },
]

const dataIncome = [
  { label: "Salario", value: 1200000 },
  { label: "Inversiones", value: 650000 },
  { label: "Otros Ingresos", value: 650000 },
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

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <h1 className="text-2xl font-bold">KPIs</h1>
      <p className="text-sm text-muted-foreground">
        This is a summary of your categories.
      </p>
          <KpiGrid data={kpis} className="grid-cols-2 md:grid-cols-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center items-center">
        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Categories expenses by month</h1>
          <BarChartComponent data={data} color="var(--color-finance-expense)"/>
        </div>
        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Income by month</h1>
          <BarChartComponent data={dataIncome} color="var(--color-finance-income)"/>
        </div>
      </div>
    </div>
  )
}