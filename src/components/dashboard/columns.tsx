"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Wallet, Tag } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Transaction } from "@/src/types/transaction.types"
import type { DashboardAccount, UserCategory } from "@/src/lib/data"

export type { Transaction }

const CategoryIcon = ({ category, categories }: { category: string; categories: UserCategory[] }) => {
  const cat = categories.find(c => c.name === category)
  if (cat) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>>)[cat.icon]
    if (Icon) return <Icon size={14} style={{ color: cat.color }} />
    return <Tag size={14} style={{ color: cat.color }} />
  }
  return <Wallet size={14} />
}

export function createColumns(t: (key: string) => string, accounts: DashboardAccount[] = [], locale = "es", categories: UserCategory[] = []): ColumnDef<Transaction>[] {
  const dateLocale = locale === "en" ? "en-US" : "es-CO"
  const todayStr = new Date().toISOString().substring(0, 10)
  const d = new Date(); d.setDate(d.getDate() - 1)
  const yesterdayStr = d.toISOString().substring(0, 10)
  return [
    {
      accessorKey: "description",
      header: t("table.description"),
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <div className="flex items-center gap-3 py-2"> 
            <div className="hidden sm:flex p-2 rounded-full bg-muted/50 text-muted-foreground shrink-0">
              <CategoryIcon category={category} categories={categories} />
            </div>
            <div className="flex flex-col min-w-0 gap-1"> 
              <span className="font-semibold text-[12px] md:text-base truncate max-w-[130px] sm:max-w-[300px] lg:max-w-[350px]">
                {row.getValue("description")}
              </span>
              <span className="text-[10px] md:text-sm text-muted-foreground/80 md:hidden uppercase tracking-widest font-bold">
                {categories.find(c => c.name === category)?.label ?? t(`categories.${category}`)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: t("table.date"),
      cell: ({ row }) => {
        const raw = row.original.rawDate
        if (!raw) return <span className="text-muted-foreground">-</span>
        const datePart = raw.substring(0, 10)
        let label: string
        if (datePart === todayStr) {
          label = t("common.today")
        } else if (datePart === yesterdayStr) {
          label = t("common.yesterday")
        } else {
          label = new Date(datePart + "T00:00:00Z").toLocaleDateString(dateLocale, {
            day: "numeric", month: "short", timeZone: "UTC",
          })
        }
        return <span className="text-[12px] md:text-sm font-medium">{label}</span>
      },
    },
    {
      accessorKey: "category",
      header: () => <div className="hidden md:block">{t("table.category")}</div>,
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        return (
          <div className="hidden md:block">
            <span className="text-xs text-muted-foreground/80 uppercase tracking-widest font-bold">
              {categories.find(c => c.name === category)?.label ?? t(`categories.${category}`)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "account_id",
      header: () => <div className="hidden md:block">{t("table.account")}</div>,
      cell: ({ row }) => {
        const accountId = row.getValue("account_id") as string | null
        const name = accounts.find(a => a.id === accountId)?.name ?? accountId
        return (
          <div className="hidden md:block">
            <span className="text-xs text-muted-foreground/80 uppercase tracking-widest font-bold">
              {name}
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
          <div className="text-right">
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] md:text-sm font-black tabular-nums border
              ${type === 'income' 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }
            `}>
              {type === 'income' ? '+ ' : '- '}
              {formatted}
            </span>
          </div>
        )
      },
    },
  ];
}