"use client"

import { useState, useMemo } from "react"
import { useI18n } from "@/src/lib/i18n"
import { Navbar } from "@/src/components/navbar"
import { TransactionTable } from "@/src/components/dashboard/transaction-table"
import { TransactionModal } from "@/src/components/dashboard/transaction-modal"
import { createColumns } from "@/src/components/dashboard/columns"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Search } from "lucide-react"
import type { DashboardTransaction, TransactionsPageData } from "@/src/lib/data"
import { ExportMenu } from "@/src/components/dashboard/export-menu"

export function TransactionsShell({ data }: { data: TransactionsPageData }) {
  const { t, locale } = useI18n()
  const dateLocale = locale === "en" ? "en-US" : "es-CO"

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [accountFilter, setAccountFilter] = useState("all")
  const [editingTransaction, setEditingTransaction] = useState<DashboardTransaction | null>(null)

  const months = useMemo(() => {
    const seen = new Set<string>()
    data.transactions.forEach(tx => {
      const m = tx.rawDate.substring(0, 7)
      if (m) seen.add(m)
    })
    return Array.from(seen).sort().reverse()
  }, [data.transactions])

  const formatMonth = (ym: string) => {
    const [year, month] = ym.split("-")
    return new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString(dateLocale, { month: "long", year: "numeric" })
  }

  const filtered = useMemo(() => {
    return data.transactions.filter(tx => {
      const q = searchQuery.trim().toLowerCase()
      return (
        (!q || tx.description.toLowerCase().includes(q)) &&
        (typeFilter === "all" || tx.type === typeFilter) &&
        (monthFilter === "all" || tx.rawDate.substring(0, 7) === monthFilter) &&
        (accountFilter === "all" || tx.account_id === accountFilter)
      )
    })
  }, [data.transactions, searchQuery, typeFilter, monthFilter, accountFilter])

  const columns = useMemo(() => createColumns(t, data.accounts, locale), [t, data.accounts, locale])

  const typeButtons: { key: "all" | "income" | "expense"; label: string }[] = [
    { key: "all", label: t("history.filterAll") },
    { key: "income", label: t("transactionModal.income") },
    { key: "expense", label: t("transactionModal.expense") },
  ]

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />

      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-2xl font-bold">{t("history.title")}</h1>
          <ExportMenu transactions={filtered} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("history.searchPlaceholder")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted/30 border-border/40 text-sm"
            />
          </div>

          <div className="flex gap-1 bg-muted/30 rounded-xl p-1 border border-border/40 shrink-0">
            {typeButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl bg-muted/30 border-border/40 text-xs shrink-0">
              <SelectValue placeholder={t("history.allMonths")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.allMonths")}</SelectItem>
              {months.map(m => (
                <SelectItem key={m} value={m} className="capitalize">
                  {formatMonth(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {data.accounts.length > 1 && (
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl bg-muted/30 border-border/40 text-xs shrink-0">
                <SelectValue placeholder={t("history.allAccounts")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.allAccounts")}</SelectItem>
                {data.accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        <TransactionTable
          columns={columns}
          data={filtered}
          onRowClick={row => setEditingTransaction(row as DashboardTransaction)}
        />
      </div>

      {editingTransaction && (
        <TransactionModal
          transaction={editingTransaction}
          open={true}
          onOpenChange={open => { if (!open) setEditingTransaction(null) }}
        />
      )}
    </div>
  )
}
