"use client"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/src/lib/i18n"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Check, Trash2 } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { SUPPORTED_CURRENCIES, getFlagUrl, getExchangeRate } from "@/src/lib/currency"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"
import { AmountInput } from "@/src/components/ui/amount-input"
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface AccountData {
  id: string
  name: string
  balance: number
  initial_balance: number
  color: string
  currency: string
}

interface AccountModalProps {
  // Create mode: render the trigger button
  hoveredAccountId?: string | null
  accountCount?: number
  // Edit mode: externally controlled
  account?: AccountData
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type SubmitErrorState = { message: string; owner: "create" | string }

// ─── Modal ────────────────────────────────────────────────────────────────────
export function AccountModal({
  hoveredAccountId,
  accountCount = 0,
  account,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: AccountModalProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null)

  const [exchangeRate, setExchangeRate] = useState(1)
  const baseCurrencyRef = useRef('COP')

  const isEditMode = !!account
  const isControlled = externalOpen !== undefined
  const open = isControlled ? (externalOpen ?? false) : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled) externalOnOpenChange?.(val)
    else setInternalOpen(val)
  }

  const clearSubmitError = () => setSubmitError(null)

  const commitSubmitError = (raw: string) => {
    const message = raw === 'account_limit_reached' ? t('accountModal.limitReached') : raw
    setSubmitError({
      message,
      owner: isEditMode && account ? account.id : "create",
    })
  }

  const currentErrorOwner = isEditMode && account ? account.id : "create"
  const displayedSubmitError =
    submitError != null && submitError.owner === currentErrorOwner
      ? submitError.message
      : null

  const handleDialogOpenChange = (next: boolean) => {
    clearSubmitError()
    setOpen(next)
  }

  const formSchema = z.object({
    name: z.string().min(2, t("validation.accountNameRequired")),
    balance: z.string().min(1, t("validation.enterAmount")),
    color: z.string().min(1, t("validation.selectColor")),
    currency: z.string().length(3),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name ?? "",
      balance: account ? String(account.initial_balance) : "",
      color: account?.color ?? "",
      currency: account?.currency ?? "COP",
    },
  })

  // Fetch base currency once on mount
  useEffect(() => {
    import('@/src/lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return
        const { data } = await supabase.from('profiles').select('base_currency').eq('id', user.id).single()
        baseCurrencyRef.current = data?.base_currency ?? 'COP'
      })
    })
  }, [])

  const handleCurrencyChange = async (currency: string) => {
    form.setValue("currency", currency)
    const base = baseCurrencyRef.current
    if (currency === base) { setExchangeRate(1); return }
    const rate = await getExchangeRate(currency, base)
    setExchangeRate(rate)
  }

  // Reset form when the account prop changes (different card clicked)
  useEffect(() => {
    if (open) {
      form.reset({
        name: account?.name ?? "",
        balance: account ? String(account.initial_balance) : "",
        color: account?.color ?? "",
        currency: account?.currency ?? "COP",
      })
      // Restore exchange rate for existing account currency
      const currency = account?.currency ?? "COP"
      const base = baseCurrencyRef.current
      if (currency !== base) {
        getExchangeRate(currency, base).then(setExchangeRate)
      } else {
        setExchangeRate(1)
      }
    }
  }, [open, account?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    clearSubmitError()

    const result = isEditMode && account
      ? await updateAccount(account.id, { name: values.name, initial_balance: values.balance, color: values.color, currency: values.currency, exchange_rate: String(exchangeRate) })
      : await createAccount({ ...values, exchange_rate: String(exchangeRate) })

    setIsSubmitting(false)

    if (result.error) {
      commitSubmitError(result.error)
      return
    }

    form.reset()
    clearSubmitError()
    setOpen(false)
  }

  async function onDelete() {
    if (!account) return
    setIsDeleting(true)
    const result = await deleteAccount(account.id)
    setIsDeleting(false)
    if (result.error) {
      commitSubmitError(result.error)
      return
    }
    clearSubmitError()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {!isEditMode && !isControlled && (
        accountCount >= 10 ? (
          <div className={cn(
            "border-2 border-dashed border-border/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-muted-foreground/40 cursor-not-allowed",
            hoveredAccountId != null ? "opacity-40" : "opacity-100"
          )}>
            <Plus size={15} />
            <span className="text-[10px] font-medium text-center leading-tight">{t("accountModal.limitReached")}</span>
          </div>
        ) : (
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
        )
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
              render={({ field, fieldState }) => (
                <FormItem className="space-y-1 text-center">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                    {isEditMode ? t("accountModal.editBalanceLabel") : t("accountModal.balanceLabel")}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className={cn(
                        "h-14 text-3xl font-bold text-center bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                        fieldState.error
                          ? "border border-destructive ring-2 ring-destructive/30 rounded-lg"
                          : "border-none"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-destructive" />
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
                  <FormMessage className="text-xs text-destructive" />
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
                  <FormMessage className="text-xs text-destructive" />
                </FormItem>
              )}
            />

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase opacity-60">
                    {t("accountModal.currencyLabel")}
                  </FormLabel>
                  <Select onValueChange={handleCurrencyChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background/40 border-border/60 cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => (
                        <SelectItem key={c} value={c} className="text-xs">
                          <span className="flex items-center gap-2">
                            <img src={getFlagUrl(c)} alt={c} className="w-4 h-auto rounded-sm shrink-0" />
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-destructive" />
                </FormItem>
              )}
            />

            {displayedSubmitError && (
              <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {displayedSubmitError}
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
