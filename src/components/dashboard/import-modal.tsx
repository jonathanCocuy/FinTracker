"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { useI18n } from "@/src/lib/i18n"
import type { DashboardAccount } from "@/src/lib/data"
import { importTransactions } from "@/src/lib/actions"
import {
  parseCSVFile,
  mapRows,
  autoDetectMapping,
  type ParsedRow,
  type ColumnMapping,
} from "@/src/lib/import-utils"

type Step = "upload" | "map" | "confirm"

interface MappingState {
  date: string
  amount: string
  description: string
  type: string
}

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: DashboardAccount[]
}

const REQUIRED_FIELDS = ["date", "amount", "description"] as const

export function ImportModal({ open, onOpenChange, accounts }: ImportModalProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const dateLocale = locale === "en" ? "en-US" : "es-CO"

  const [step, setStep] = useState<Step>("upload")
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<MappingState>({ date: "", amount: "", description: "", type: "" })
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [invalidCount, setInvalidCount] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files: File[]) => {
      if (files[0]) setFile(files[0])
    }, []),
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
      "text/plain": [".csv"],
    },
    maxFiles: 1,
  })

  function reset() {
    setStep("upload")
    setFile(null)
    setHeaders([])
    setRawRows([])
    setMapping({ date: "", amount: "", description: "", type: "" })
    setParsedRows([])
    setInvalidCount(0)
    setImporting(false)
    setImportError(null)
    setResult(null)
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  async function handleToMap() {
    if (!file) return
    const { headers: h, rawRows: r } = await parseCSVFile(file)
    setHeaders(h)
    setRawRows(r)
    const detected = autoDetectMapping(h)
    setMapping({
      date: detected.date ?? "",
      amount: detected.amount ?? "",
      description: detected.description ?? "",
      type: detected.type ?? "",
    })
    setStep("map")
  }

  function handleToConfirm() {
    if (!mapping.date || !mapping.amount || !mapping.description) return
    const m: ColumnMapping = {
      date: mapping.date,
      amount: mapping.amount,
      description: mapping.description,
      type: mapping.type || undefined,
    }
    const { valid, invalid } = mapRows(rawRows, m)
    setParsedRows(valid)
    setInvalidCount(invalid)
    setStep("confirm")
  }

  async function handleImport() {
    if (!parsedRows.length) return
    setImporting(true)
    setImportError(null)
    try {
      const rows = parsedRows.map(({ date, amount, description, type, fingerprint }) => ({
        date,
        amount,
        description,
        type,
        fingerprint,
      }))
      const res = await importTransactions(rows, accountId)
      if (res.error) {
        setImportError(res.error)
        return
      }
      setResult({ imported: res.imported, skipped: res.skipped })
      router.refresh()
    } finally {
      setImporting(false)
    }
  }

  const mappingComplete = mapping.date && mapping.amount && mapping.description

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
        </DialogHeader>

        {/* ── Success ───────────────────────────────────────────── */}
        {result ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 size={40} className="text-green-500" />
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">
                {result.imported} {t("import.imported")}
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.skipped} {t("import.skipped")}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="rounded-xl"
            >
              {t("import.close")}
            </Button>
          </div>
        ) : step === "upload" ? (
          /* ── Step 1: Upload ────────────────────────────────────── */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("common.account")}</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="rounded-xl bg-muted/30 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border/40 hover:border-border/80 bg-muted/20"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload size={28} />
                  <p className="text-sm font-medium">
                    {isDragActive ? t("import.dropHere") : t("import.dropzone")}
                  </p>
                  <p className="text-xs">{t("import.csvOnly")}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleToMap}
                disabled={!file || !accountId}
                className="gap-1.5 rounded-xl"
              >
                {t("import.continue")}
                <ChevronRight size={14} />
              </Button>
            </DialogFooter>
          </div>
        ) : step === "map" ? (
          /* ── Step 2: Map columns ───────────────────────────────── */
          <div className="space-y-5">
            <div className="space-y-3">
              {REQUIRED_FIELDS.map(field => (
                <div key={field} className="flex items-center gap-3">
                  <label className="text-sm font-medium w-32 shrink-0">
                    {t(`import.field.${field}`)}
                    <span className="text-destructive ml-0.5">*</span>
                  </label>
                  <Select
                    value={mapping[field]}
                    onValueChange={v => setMapping(prev => ({ ...prev, [field]: v }))}
                  >
                    <SelectTrigger className="flex-1 rounded-xl bg-muted/30 border-border/40 text-sm">
                      <SelectValue placeholder={t("import.selectColumn")} />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-32 shrink-0 text-muted-foreground">
                  {t("import.field.type")}
                </label>
                <Select
                  value={mapping.type || "__none__"}
                  onValueChange={v => setMapping(prev => ({ ...prev, type: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger className="flex-1 rounded-xl bg-muted/30 border-border/40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("import.noColumn")}</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CSV preview */}
            {rawRows.length > 0 && (
              <div className="rounded-lg border border-border/40 overflow-auto max-h-32">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40">
                      {headers.map(h => (
                        <th key={h} className="px-2.5 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0">
                        {headers.map(h => (
                          <td key={h} className="px-2.5 py-1.5 whitespace-nowrap max-w-[120px] truncate text-muted-foreground">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("upload")} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleToConfirm}
                disabled={!mappingComplete}
                className="gap-1.5 rounded-xl"
              >
                {t("import.continue")}
                <ChevronRight size={14} />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Step 3: Confirm ───────────────────────────────────── */
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-1.5">
              <p className="text-sm font-medium">
                {parsedRows.length} {t("import.found")}
              </p>
              {invalidCount > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {invalidCount} {t("import.invalidRows")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t("import.duplicatesNote")}</p>
            </div>

            {parsedRows.length > 0 && (
              <div className="rounded-lg border border-border/40 overflow-auto max-h-52">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-sm">
                    <tr className="border-b border-border/40">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("common.description")}</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 30).map((row, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0">
                        <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                          {new Date(row.date).toLocaleDateString(dateLocale)}
                        </td>
                        <td className="px-3 py-1.5 max-w-[200px] truncate">{row.description}</td>
                        <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${
                          row.type === "income" ? "text-green-600" : "text-destructive"
                        }`}>
                          {row.type === "income" ? "+" : "-"}
                          {row.amount.toLocaleString(dateLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 30 && (
                  <p className="text-center text-xs text-muted-foreground py-2 border-t border-border/20">
                    +{parsedRows.length - 30} {t("import.more")}
                  </p>
                )}
              </div>
            )}

            {importError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle size={12} />
                {importError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("map")} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || parsedRows.length === 0}
                className="rounded-xl"
              >
                {importing
                  ? t("import.importing")
                  : `${t("import.import")} ${parsedRows.length} ${t("import.transactions")}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
