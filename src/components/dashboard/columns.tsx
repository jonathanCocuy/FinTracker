"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRight, ShoppingBag, Utensils, Car, Tv, Wallet } from "lucide-react"

export type Transaction = {
  id: string
  date: string
  category: string
  description: string
  amount: number
  type: "income" | "expense"
}

const CategoryIcon = ({ category }: { category: string }) => {
  const icons: Record<string, React.ReactNode> = {
    food: <Utensils size={14} />,
    transport: <Car size={14} />,
    subscriptions: <Tv size={14} />,
    housing: <ShoppingBag size={14} />,
    income: <ArrowUpRight size={14} className="text-emerald-500" />,
  }
  return icons[category] || <Wallet size={14} />
}

export function createColumns(t: (key: string) => string): ColumnDef<Transaction>[] {
  return [
    {
      accessorKey: "description",
      header: t("table.description"),
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <div className="flex items-center gap-3 py-2"> 
            <div className="hidden sm:flex p-2 rounded-full bg-muted/50 text-muted-foreground shrink-0">
              <CategoryIcon category={category} />
            </div>
            <div className="flex flex-col min-w-0 gap-1"> 
              <span className="font-semibold text-sm md:text-base truncate max-w-[130px] sm:max-w-[300px] lg:max-w-[350px]">
                {row.getValue("description")}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground/80 md:hidden uppercase tracking-widest font-bold">
                {t(`categories.${category}`)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: t("table.date"),
      cell: ({ row }) => (
        <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
          {row.getValue("date")}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: () => <div className="hidden md:block">{t("table.category")}</div>,
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        return (
          <div className="hidden md:block">
            <span className="text-sm text-muted-foreground/80 uppercase tracking-widest font-bold ">
              {t(`categories.${category}`)}
            </span>
          </div>
        )
      },
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
          <div className={`text-sm md:text-lg text-right font-bold tabular-nums ${
            type === 'income' ? 'text-emerald-500' : 'text-red-500' 
          }`}> {/* Rojo para gastos, Verde para ingresos */}
            {type === 'income' ? '+' : '-'} {formatted}
          </div>
        )
      },
    },
  ];
}