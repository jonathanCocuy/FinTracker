"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/src/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Trash2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { ResponsiveModal } from "@/src/components/ui/responsive-modal"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { AmountInput } from "@/src/components/ui/amount-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  createInvestmentRecord,
  updateInvestmentRecord,
  deleteInvestmentRecord,
} from "@/src/lib/actions"
import type { InvestmentRecord } from "@/src/lib/data"

interface InvestmentModalProps {
  record?: InvestmentRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INVESTMENT_TYPES = ["etf", "stock", "crypto", "fund", "other"] as const

export function InvestmentModal({ record, open, onOpenChange }: InvestmentModalProps) {
  const { t } = useI18n()
  const isEdit = !!record
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const today = new Date().toISOString().split("T")[0]

  const formSchema = z.object({
    name:     z.string().min(1),
    type:     z.enum(["etf", "stock", "crypto", "fund", "other"]),
    amount:   z.string().min(1),
    currency: z.enum(["COP", "USD"]),
    date:     z.string().min(1),
    notes:    z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:     record?.name ?? "",
      type:     record?.type ?? "etf",
      amount:   record ? String(record.amount) : "",
      currency: record?.currency ?? "COP",
      date:     record?.date ?? today,
      notes:    record?.notes ?? "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name:     record?.name ?? "",
        type:     record?.type ?? "etf",
        amount:   record ? String(record.amount) : "",
        currency: record?.currency ?? "COP",
        date:     record?.date ?? today,
        notes:    record?.notes ?? "",
      })
      setSubmitError(null)
    }
  }, [open, record?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSubmitError(null)
    const result = isEdit && record
      ? await updateInvestmentRecord(record.id, values)
      : await createInvestmentRecord(values)
    setIsSubmitting(false)
    if (result.error) { setSubmitError(result.error); return }
    form.reset()
    onOpenChange(false)
  }

  async function onDelete() {
    if (!record) return
    setIsDeleting(true)
    const result = await deleteInvestmentRecord(record.id)
    setIsDeleting(false)
    if (result.error) { setSubmitError(result.error); return }
    onOpenChange(false)
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}
      title={isEdit ? t("investments.editRecord") : t("investments.addRecord")}
      className="sm:max-w-[440px]"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">

            {/* Name */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("investments.namePlaceholder")} className="h-10 bg-background/40 border-border/60" {...field} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Type */}
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.typeLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-background/40 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{t(`investments.types.${type}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.amountLabel")}</FormLabel>
                  <FormControl>
                    <AmountInput value={field.value} onChange={field.onChange} placeholder="0" className="h-10 bg-background/40 border-border/60" />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.currencyLabel")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background/40 border-border/60">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COP">COP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {/* Date */}
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.dateLabel")}</FormLabel>
                <FormControl>
                  <Input type="date" className="h-10 bg-background/40 border-border/60" {...field} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Notes */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase opacity-60">{t("investments.notesLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("investments.notesPlaceholder")} className="h-10 bg-background/40 border-border/60" {...field} />
                </FormControl>
              </FormItem>
            )} />

            {submitError && (
              <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {submitError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || isDeleting} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2 cursor-pointer">
              {isSubmitting ? t("common.saving") : isEdit ? t("investments.saveChanges") : t("investments.saveRecord")}
            </Button>

            {isEdit && (
              <Button type="button" variant="ghost" disabled={isSubmitting || isDeleting} onClick={onDelete}
                className="w-full h-10 text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                <Trash2 size={14} className="mr-2" />
                {isDeleting ? t("common.deleting") : t("investments.deleteRecord")}
              </Button>
            )}
          </form>
        </Form>
    </ResponsiveModal>
  )
}
