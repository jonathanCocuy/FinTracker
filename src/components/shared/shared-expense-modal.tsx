"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Switch } from "@/src/components/ui/switch"
import { AmountInput } from "@/src/components/ui/amount-input"
import { useI18n } from "@/src/lib/i18n"
import { createSharedExpense, updateSharedExpense, deleteSharedExpense } from "@/src/lib/shared-actions"
import { Loader2, Trash2, Users } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/src/components/ui/alert-dialog"
import type { SharedMember, SharedExpense, SharedGroupDetail } from "@/src/lib/shared-data"

const schema = z.object({
  description: z.string().min(1),
  amount: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
  paid_by_member_id: z.string().nullable(),
  account_id: z.string().nullable(),
  is_recurring: z.boolean(),
  notes: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

export function SharedExpenseModal({
  open,
  onOpenChange,
  groupId,
  members,
  accounts,
  categories,
  expense,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  members: SharedMember[]
  accounts: SharedGroupDetail['accounts']
  categories: { name: string; label: string }[]
  expense?: SharedExpense
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const myMember = members.find(m => m.is_me)

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: expense?.description ?? '',
      amount: expense?.amount?.toString() ?? '',
      category: expense?.category ?? 'home',
      date: expense?.date ?? new Date().toISOString().substring(0, 10),
      paid_by_member_id: expense?.paid_by_member_id ?? myMember?.id ?? null,
      account_id: expense?.account_id ?? (accounts[0]?.id ?? null),
      is_recurring: expense?.is_recurring ?? false,
      notes: expense?.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        description: expense?.description ?? '',
        amount: expense?.amount?.toString() ?? '',
        category: expense?.category ?? 'home',
        date: expense?.date ?? new Date().toISOString().substring(0, 10),
        paid_by_member_id: expense?.paid_by_member_id ?? myMember?.id ?? null,
        account_id: expense?.account_id ?? (accounts[0]?.id ?? null),
        is_recurring: expense?.is_recurring ?? false,
        notes: expense?.notes ?? '',
      })
      setSubmitError(null)
    }
  }, [open, expense])

  const paidByMemberId = watch('paid_by_member_id')
  const paidByMe = paidByMemberId === myMember?.id
  const mySharePct = myMember?.share_pct ?? 0

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setSubmitError(null)

    const input = {
      group_id: groupId,
      ...data,
      is_me_payer: paidByMe,
      my_share_pct: mySharePct,
    }

    const res = expense
      ? await updateSharedExpense(expense.id, input)
      : await createSharedExpense(input)

    setLoading(false)

    if (res.error) {
      setSubmitError(res.error)
    } else {
      onOpenChange(false)
    }
  }

  const handleDelete = async () => {
    if (!expense) return
    setDeleting(true)
    await deleteSharedExpense(expense.id, groupId)
    setDeleting(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Users size={18} />
                </div>
                {expense ? t('shared.editExpense') : t('shared.addExpense')}
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t('common.description')}</Label>
              <Input {...register('description')} placeholder={t('shared.expensePlaceholder')} className="rounded-xl bg-muted/50" />
              {errors.description && <span className="text-xs text-rose-500">{t('validation.descriptionRequired')}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>{t('common.amount')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Controller name="amount" control={control} render={({ field }) => (
                    <AmountInput id="amount" value={field.value} onChange={field.onChange} placeholder="0" className="pl-7 rounded-xl bg-muted/50" />
                  )} />
                </div>
                {errors.amount && <span className="text-xs text-rose-500">{t('validation.enterAmount')}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t('common.date')}</Label>
                <Input type="date" {...register('date')} className="rounded-xl bg-muted/50" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('common.category')}</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('shared.paidBy')}</Label>
              <Controller name="paid_by_member_id" control={control} render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}{m.is_me ? ` (${t('shared.me')})` : ''}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            {paidByMe && accounts.length > 0 && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <Label className="text-sm">{t('shared.myAccount')}</Label>
                <Controller name="account_id" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                            {a.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                <p className="text-xs text-muted-foreground">
                  {t('shared.myShareNote').replace('{{pct}}', String(mySharePct))}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
              <Label className="text-sm font-medium">{t('shared.recurring')}</Label>
              <Controller name="is_recurring" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            {submitError && <p className="text-xs text-rose-500 text-center">{submitError}</p>}

            <DialogFooter className="pt-4 border-t border-border/40 flex sm:justify-between items-center gap-2">
              {expense ? (
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(true)} disabled={loading || deleting}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl px-3">
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">{t('common.cancel')}</Button>
                <Button type="submit" disabled={loading} className="rounded-xl min-w-[100px]">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : expense ? t('shared.saveChanges') : t('shared.saveExpense')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shared.deleteExpense')}</AlertDialogTitle>
            <AlertDialogDescription>{t('shared.deleteExpenseDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" className="rounded-xl" onClick={handleDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
