"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRight, ShoppingBag, Utensils, Car, Tv } from "lucide-react"

export type Transaction = {
  id: string
  date: string
  category: string
  description: string
  amount: number
  type: "income" | "expense"
}

export function createColumns(t: (key: string) => string): ColumnDef<Transaction>[] {
  return [
  {
    accessorKey: "description",
    header: t("table.description"),
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted/50">
             {/* Iconos dinámicos por categoría */}
            {category === "food" && <Utensils size={14} />}
            {category === "transport" && <Car size={14} />}
            {category === "subscriptions" && <Tv size={14} />}
            {category === "housing" && <ShoppingBag size={14} />}
            {category === "income" && <ArrowUpRight size={14} className="text-emerald-500" />}
          </div>
          <span className="font-medium">{row.getValue("description")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: t("table.date"),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">{t("table.amount")}</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.type
      const formatted = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(amount)

      return (
        <div className={`text-right font-bold ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {type === 'income' ? '+' : '-'} {formatted}
        </div>
      )
    },
  },
]
}