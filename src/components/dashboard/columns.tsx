"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRight, ShoppingBag, Utensils, Car, Tv } from "lucide-react"

export type Transaction = {
  id: string
  date: string
  category: "Comida" | "Transporte" | "Vivienda" | "Suscripciones" | "Ingreso"
  description: string
  amount: number
  type: "income" | "expense"
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted/50">
             {/* Iconos dinámicos por categoría */}
            {category === "Comida" && <Utensils size={14} />}
            {category === "Transporte" && <Car size={14} />}
            {category === "Suscripciones" && <Tv size={14} />}
            {category === "Vivienda" && <ShoppingBag size={14} />}
            {category === "Ingreso" && <ArrowUpRight size={14} className="text-emerald-500" />}
          </div>
          <span className="font-medium">{row.getValue("description")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Fecha",
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Monto</div>,
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