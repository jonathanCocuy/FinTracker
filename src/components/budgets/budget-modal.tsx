"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { upsertBudget } from "@/src/lib/actions"
import { useI18n } from "@/src/lib/i18n"
import type { BudgetWithProgress } from "@/src/lib/data"
import { Utensils, Car, Building2, Home, Tv, Gamepad2, Tag, Package } from "lucide-react"

export const BUDGET_CATEGORIES = [
  "food", "transport", "housing", "home", "subscriptions", "leisure", "other",
] as const

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  food: <Utensils size={16} />,
  transport: <Car size={16} />,
  housing: <Building2 size={16} />,
  home: <Home size={16} />,
  subscriptions: <Tv size={16} />,
  leisure: <Gamepad2 size={16} />,
  other: <Tag size={16} />,
}

const DEFAULT_ICON = <Package size={16} />

interface BudgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingBudget?: BudgetWithProgress | null
  usedCategories?: string[]
}

export function BudgetModal({ open, onOpenChange, existingBudget, usedCategories = [] }: BudgetModalProps) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!existingBudget

  const schema = z.object({
    category: z.string().min(1, t("validation.selectCategory")),
    monthly_limit: z.string().min(1, t("validation.enterAmount")),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", monthly_limit: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        category: existingBudget?.category ?? "",
        monthly_limit: existingBudget ? String(existingBudget.monthly_limit) : "",
      })
      setServerError(null)
    }
  }, [open, existingBudget, form])

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true)
    setServerError(null)
    const result = await upsertBudget(values)
    setSaving(false)
    if (result.error) {
      setServerError(result.error)
      return
    }
    onOpenChange(false)
  }

  const availableCategories = BUDGET_CATEGORIES.filter(
    c => isEditing ? true : !usedCategories.includes(c)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? t("budgets.editBudget") : t("budgets.addBudget")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("budgets.categoryLabel")}
                  </FormLabel>
                  <FormControl>
                    {isEditing ? (
                      <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/40 bg-muted/30 text-sm text-muted-foreground">
                        <span className="text-foreground/60">{CATEGORY_ICONS[field.value] ?? DEFAULT_ICON}</span>
                        <span>{t(`categories.${field.value}`)}</span>
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="rounded-xl border-border/40 bg-muted/30 text-sm h-9">
                          <SelectValue placeholder={t("budgets.categoryLabel")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              <span className="flex items-center gap-2">
                                {CATEGORY_ICONS[cat] ?? DEFAULT_ICON}
                                {t(`categories.${cat}`)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthly_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("budgets.limitLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      step="1"
                      placeholder={t("budgets.limitPlaceholder")}
                      className="rounded-xl border-border/40 bg-muted/30 text-sm h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-xs text-rose-500 text-center">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl font-semibold mt-1"
            >
              {saving ? t("common.saving") : isEditing ? t("budgets.saveChanges") : t("budgets.saveBudget")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
