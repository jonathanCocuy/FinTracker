"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Button } from "@/src/components/ui/button"
import { useI18n } from "@/src/lib/i18n"
import type { DashboardTransaction } from "@/src/lib/data"
import type { ExportLabels } from "@/src/lib/export-utils"

interface ExportMenuProps {
  transactions: DashboardTransaction[]
}

export function ExportMenu({ transactions }: ExportMenuProps) {
  const { t, locale } = useI18n()
  const [busy, setBusy] = useState(false)

  function getLabels(): ExportLabels {
    return {
      totalIncome: t("export.totalIncome"),
      totalExpenses: t("export.totalExpenses"),
      netBalance: t("export.netBalance"),
      reportTitle: t("export.reportTitle"),
      colDate: t("export.colDate"),
      colCategory: t("export.colCategory"),
      colDescription: t("export.colDescription"),
      colType: t("export.colType"),
      colAmount: t("export.colAmount"),
      sheetName: t("export.sheetName"),
      income: t("transactionModal.income"),
      expense: t("transactionModal.expense"),
    }
  }

  async function handleExcel() {
    setBusy(true)
    try {
      const { exportToExcel } = await import("@/src/lib/export-utils")
      exportToExcel(transactions, getLabels())
    } finally {
      setBusy(false)
    }
  }

  async function handlePdf() {
    setBusy(true)
    try {
      const { exportToPdf } = await import("@/src/lib/export-utils")
      exportToPdf(transactions, getLabels(), locale)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || transactions.length === 0}
          className="h-9 gap-2 rounded-xl border-border/40 bg-muted/30 text-xs font-semibold"
        >
          <Download size={14} />
          {t("export.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet size={14} className="text-green-600 shrink-0" />
          {t("export.toExcel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} className="gap-2 cursor-pointer">
          <FileText size={14} className="text-red-500 shrink-0" />
          {t("export.toPdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
