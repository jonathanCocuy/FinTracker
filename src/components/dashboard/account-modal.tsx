"use client"

import React, { useState, useEffect } from "react"
import { useI18n } from "@/src/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Check, Trash2 } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createAccount, updateAccount, deleteAccount } from "@/src/lib/actions"

// ─── Color palette (class stored in DB, hex used only for display) ────────────
const ACCOUNT_COLORS = [
  { class: "bg-pink-600",    hex: "#db2777" },
  { class: "bg-purple-500",  hex: "#a855f7" },
  { class: "bg-emerald-600", hex: "#059669" },
  { class: "bg-blue-500",    hex: "#3b82f6" },
  { class: "bg-orange-500",  hex: "#f97316" },
  { class: "bg-red-500",     hex: "#ef4444" },
  { class: "bg-yellow-500",  hex: "#eab308" },
  { class: "bg-indigo-500",  hex: "#6366f1" },
  { class: "bg-teal-500",    hex: "#14b8a6" },
  { class: "bg-cyan-500",    hex: "#06b6d4" },
]

// ─── Formatted amount input (es-CO: 1.000.000) ────────────────────────────────
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
  const [isFocused, setIsFocused] = useState(false)

  React.useEffect(() => {
    if (!isFocused) setRaw(value)
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d.,]/g, "")
    setRaw(v)
    const numStr = v.replace(/\./g, "").replace(",", ".")
    onChange(numStr || "")
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (raw) {
      const num = parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0
      onChange(String(num))
    }
  }

  const displayValue = isFocused
    ? raw
    : value
      ? amountFormatter.format(parseFloat(value) || 0)
      : ""

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      {...props}
    />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AccountData {
  id: string
  name: string
  balance: number
  color: string
}

interface AccountModalProps {
  // Create mode: render the trigger button
  hoveredAccountId?: string | null
  // Edit mode: externally controlled
  account?: AccountData
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function AccountModal({
  hoveredAccountId,
  account,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: AccountModalProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEditMode = !!account
  const isControlled = externalOpen !== undefined
  const open = isControlled ? (externalOpen ?? false) : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled) externalOnOpenChange?.(val)
    else setInternalOpen(val)
  }

  const formSchema = z.object({
    name: z.string().min(2, t("validation.accountNameRequired")),
    balance: z.string().min(1, t("validation.enterAmount")),
    color: z.string().min(1, t("validation.selectColor")),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name ?? "",
      balance: account ? String(account.balance) : "",
      color: account?.color ?? "",
    },
  })

  // Reset form when the account prop changes (different card clicked)
  useEffect(() => {
    if (open) {
      form.reset({
        name: account?.name ?? "",
        balance: account ? String(account.balance) : "",
        color: account?.color ?? "",
      })
      setSubmitError(null)
    }
  }, [open, account?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSubmitError(null)

    const result = isEditMode && account
      ? await updateAccount(account.id, values)
      : await createAccount(values)

    setIsSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }

    form.reset()
    setOpen(false)
  }

  async function onDelete() {
    if (!account) return
    setIsDeleting(true)
    const result = await deleteAccount(account.id)
    setIsDeleting(false)
    if (result.error) {
      setSubmitError(result.error)
      return
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && !isControlled && (
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-2 border-dashed border-border/30 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group",
              hoveredAccountId != null ? "opacity-40" : "opacity-100"
            )}
          >
            <Plus size={15} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">{t("accountsCard.addAccount")}</span>
          </button>
        </DialogTrigger>
      )}

      <DialogContent className="w-[95%] mx-auto sm:max-w-[425px] bg-card/95 backdrop-blur-md border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-center sm:text-left">
            {isEditMode ? t("accountModal.editTitle") : t("accountModal.title")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">

            {/* Balance */}
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem className="space-y-1 text-center">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                    {isEditMode ? t("accountModal.editBalanceLabel") : t("accountModal.balanceLabel")}
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

            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                    {t("accountModal.nameLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("accountModal.namePlaceholder")}
                      className="h-10 bg-background/40 border-border/60"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                    {t("accountModal.colorLabel")}
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ACCOUNT_COLORS.map((color) => (
                        <button
                          key={color.class}
                          type="button"
                          onClick={() => field.onChange(color.class)}
                          className={cn(
                            "h-7 w-7 rounded-full transition-all duration-150 flex items-center justify-center ring-offset-background",
                            field.value === color.class
                              ? "ring-2 ring-white ring-offset-2 scale-110"
                              : "hover:scale-110"
                          )}
                          style={{ backgroundColor: color.hex }}
                        >
                          {field.value === color.class && (
                            <Check size={12} className="text-white" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

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
                  ? t("accountModal.saveChanges")
                  : t("accountModal.saveAccount")}
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
                {isDeleting ? t("common.deleting") : t("accountModal.deleteAccount")}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
