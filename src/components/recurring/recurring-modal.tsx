"use client"

import React, { useState, useEffect } from "react"
import { useI18n } from "@/src/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { supabase } from "@/src/lib/supabase"
import {
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  fetchUserCategories,
} from "@/src/lib/actions"
import { CategoryModal } from "@/src/components/categories/category-modal"

import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { IconPicker } from "@/src/components/ui/icon-picker"
import { Trash2, Plus } from "lucide-react"
import type { RecurringTemplate } from "@/src/lib/data"

// ─── Amount input (same locale logic as transaction modal) ────────────────────
const amountFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function AmountInput({
  value,
  onChange,
  ...props
}: {
  value: string
  onChange: (v: string) => void
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">) {
  const [raw, setRaw] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => { if (!focused) setRaw(value) }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d.,]/g, "")
    setRaw(v)
    onChange(v.replace(/\./g, "").replace(",", ".") || "")
  }
  const handleBlur = () => {
    setFocused(false)
    if (raw) {
      const n = parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0
      onChange(String(n))
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={focused ? raw : value ? amountFormatter.format(parseFloat(value) || 0) : ""}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      {...props}
    />
  )
}

// ─── Week-day pill config (Mon-first display, JS day value) ───────────────────
const WEEKDAYS = [
  { label: "Lu", value: 1 },
  { label: "Ma", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Ju", value: 4 },
  { label: "Vi", value: 5 },
  { label: "Sa", value: 6 },
  { label: "Do", value: 0 },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecurringModalProps {
  template?: RecurringTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  icon: z.string(),
  description: z.string().min(2),
  amount: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(["income", "expense"]),
  account_id: z.string().min(1),
  interval: z.enum(["monthly", "weekly"]),
  day_of_month: z.number().int().min(1).max(31),
  day_of_week: z.number().int().min(0).max(6),
}).superRefine((data, ctx) => {
  if (data.interval === "monthly" && !data.day_of_month) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona el día", path: ["day_of_month"] })
  }
  if (data.interval === "weekly" && data.day_of_week === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona el día", path: ["day_of_week"] })
  }
})

type FormValues = z.infer<typeof formSchema>

// ─── Modal component ──────────────────────────────────────────────────────────
export function RecurringModal({ template, open, onOpenChange }: RecurringModalProps) {
  const { t } = useI18n()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; label: string; color: string }[]>([])
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const isEditMode = !!template

  const buildDefaults = (t?: RecurringTemplate): FormValues => ({
    icon:         t?.icon       ?? "",
    description:  t?.description ?? "",
    amount:       t             ? String(t.amount) : "",
    category:     t?.category   ?? "",
    type:         (t?.type      ?? "expense") as "income" | "expense",
    account_id:   t?.account_id ?? "",
    interval:     (t?.interval  ?? "monthly") as "monthly" | "weekly",
    day_of_month: t?.day_of_month ?? 1,
    day_of_week:  t?.day_of_week  ?? 1,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(template),
  })

  useEffect(() => {
    if (!open) return
    form.reset(buildDefaults(template))
    supabase.from("accounts").select("id, name").then(({ data }) => { if (data) setAccounts(data) })
    fetchUserCategories().then(setCategories)
  }, [open, template?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const watchInterval = form.watch("interval")

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      icon:         values.icon || "Repeat",
      description:  values.description,
      amount:       values.amount,
      category:     values.category,
      type:         values.type,
      account_id:   values.account_id,
      interval:     values.interval,
      day_of_month: values.interval === "monthly" ? values.day_of_month : null,
      day_of_week:  values.interval === "weekly"  ? values.day_of_week  : null,
    }

    const result = isEditMode
      ? await updateRecurringTemplate(template.id, payload)
      : await createRecurringTemplate(payload)

    setIsSubmitting(false)

    if (result.error) { setSubmitError(result.error); return }
    form.reset()
    onOpenChange(false)
  }

  async function onDelete() {
    if (!template) return
    setIsDeleting(true)
    const result = await deleteRecurringTemplate(template.id)
    setIsDeleting(false)
    if (result.error) { setSubmitError(result.error); return }
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}>
        <DialogContent className="w-[95%] mx-auto sm:max-w-[425px] bg-card/95 backdrop-blur-md border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-center sm:text-left">
              {isEditMode ? t("recurring.editTemplate") : t("recurring.addTemplate")}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">

              {/* ── Amount ───────────────────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-1 text-center">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                      {t("transactionModal.amountLabel")}
                    </FormLabel>
                    <FormControl>
                      <AmountInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0"
                        className="h-14 text-3xl font-bold text-center bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* ── Type toggle ──────────────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                      {t("transactionModal.typeLabel")}
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {(["expense", "income"] as const).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => field.onChange(opt)}
                            className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                              field.value === opt
                                ? opt === "expense"
                                  ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                                  : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-background/40 border-border/60 text-muted-foreground hover:border-border"
                            }`}
                          >
                            {t(`transactionModal.${opt}`)}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ── Icon + Description ───────────────────────────────────────── */}
              <div className="flex flex-row gap-2 items-center">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={t("recurring.descriptionPlaceholder")}
                          className="h-10 bg-background/40 border-border/60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Category + Account ───────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                        {t("transactionModal.categoryLabel")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        open={categorySelectOpen}
                        onOpenChange={setCategorySelectOpen}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/40 cursor-pointer">
                            <SelectValue placeholder={t("transactionModal.categoryPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                {cat.label}
                              </span>
                            </SelectItem>
                          ))}
                          <div className="border-t border-border/40 mt-1 pt-1 px-1">
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                              onPointerDown={(e) => {
                                e.preventDefault()
                                setCategorySelectOpen(false)
                                setCategoryModalOpen(true)
                              }}
                            >
                              <Plus size={12} />
                              {t("categoriesPage.addCategory")}
                            </button>
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                        {t("transactionModal.accountLabel")}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/40 cursor-pointer">
                            <SelectValue placeholder={t("transactionModal.accountPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Interval toggle ──────────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                      {t("recurring.intervalLabel")}
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {(["monthly", "weekly"] as const).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => field.onChange(opt)}
                            className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                              field.value === opt
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "bg-background/40 border-border/60 text-muted-foreground hover:border-border"
                            }`}
                          >
                            {t(`recurring.${opt}`)}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ── Day selector (conditional) ───────────────────────────────── */}
              {watchInterval === "monthly" ? (
                <FormField
                  control={form.control}
                  name="day_of_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                        {t("recurring.dayOfMonthLabel")}
                      </FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/40 cursor-pointer">
                            <SelectValue placeholder={t("recurring.dayOfMonthLabel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={String(day)}>
                              {t("recurring.everyMonthDay").replace("{{day}}", String(day))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                        {t("recurring.dayOfWeekLabel")}
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-7 gap-1">
                          {WEEKDAYS.map(({ label, value }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={`h-9 rounded-lg text-[11px] font-bold border transition-all ${
                                field.value === value
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "bg-background/40 border-border/60 text-muted-foreground hover:border-border"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}

              {submitError && (
                <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2 cursor-pointer"
              >
                {isSubmitting
                  ? t("common.saving")
                  : isEditMode
                    ? t("recurring.saveChanges")
                    : t("recurring.saveTemplate")}
              </Button>

              {isEditMode && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting || isDeleting}
                  onClick={onDelete}
                  className="w-full h-10 text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 size={14} className="mr-2" />
                  {isDeleting ? t("common.deleting") : t("recurring.deleteTemplate")}
                </Button>
              )}

            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={(open) => {
          setCategoryModalOpen(open)
          if (!open) fetchUserCategories().then(setCategories)
        }}
      />
    </>
  )
}
