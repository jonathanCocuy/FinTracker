"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { useI18n } from "@/src/lib/i18n"
import { contributeToGoal } from "@/src/lib/actions"
import { Loader2, Plus } from "lucide-react"
import type { SavingsGoal, DashboardAccount } from "@/src/lib/data"

const contributeSchema = z.object({
  amount: z.string().min(1, "validation.enterAmount"),
  create_transaction: z.boolean(),
  account_id: z.string().optional().nullable(),
})

type FormData = z.infer<typeof contributeSchema>

export function ContributeModal({
  open,
  onOpenChange,
  goal,
  accounts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal
  accounts: DashboardAccount[]
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: "",
      create_transaction: false,
      account_id: accounts.length > 0 ? accounts[0].id : null,
    },
  })

  const createTransaction = watch("create_transaction")

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    const res = await contributeToGoal(goal.id, data)

    setLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) reset()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Plus size={18} />
              </div>
              {t("goals.contributeTitle")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t("goals.contributeDesc")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{t("common.amount")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
                className="pl-7 rounded-xl bg-muted/50 font-medium text-lg h-12"
              />
            </div>
            {errors.amount && <span className="text-xs text-rose-500">{t(errors.amount.message as Parameters<typeof t>[0])}</span>}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">{t("goals.createTransaction")}</Label>
            </div>
            <Switch
              checked={createTransaction}
              onCheckedChange={(checked) => setValue("create_transaction", checked)}
            />
          </div>

          {createTransaction && accounts.length > 0 && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
              <Label>{t("common.account")}</Label>
              <Select 
                onValueChange={(val) => setValue("account_id", val)} 
                defaultValue={watch("account_id") || undefined}
              >
                <SelectTrigger className="rounded-xl bg-muted/50">
                  <SelectValue placeholder={t("validation.selectAccount")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: acc.color }} />
                        {acc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {createTransaction && accounts.length === 0 && (
            <div className="text-xs text-rose-500">
              {t("goals.noAccounts")}
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t border-border/40">
            <div className="flex gap-2 w-full sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading || (createTransaction && accounts.length === 0)} className="rounded-xl min-w-[100px]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : t("goals.contribute")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
