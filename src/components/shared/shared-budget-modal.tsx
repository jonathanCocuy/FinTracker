"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { AmountInput } from "@/src/components/ui/amount-input"
import { useI18n } from "@/src/lib/i18n"
import { createSharedBudget, addSharedBudgetEntry, deleteSharedBudgetEntry, deleteSharedBudget } from "@/src/lib/shared-actions"
import { Loader2, ShoppingCart, Plus, Trash2 } from "lucide-react"
import type { SharedBudget } from "@/src/lib/shared-data"

function fmt(n: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export function SharedBudgetCreateModal({
  open,
  onOpenChange,
  groupId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setAmountError(null)
    let valid = true
    if (!name.trim()) { setNameError(t("validation.nameRequired")); valid = false }
    if (!amount) { setAmountError(t("validation.enterAmount")); valid = false }
    if (!valid) return
    setLoading(true)
    setError(null)
    const res = await createSharedBudget({ group_id: groupId, name, total_amount: amount, month })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setName(''); setAmount(''); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setError(null); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><ShoppingCart size={18} /></div>
              {t('shared.addBudget')}
            </DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t('shared.budgetName')}</Label>
            <Input value={name} onChange={e => { setName(e.target.value); if (nameError) setNameError(null) }} placeholder={t('shared.budgetNamePlaceholder')} className="rounded-xl bg-muted/50" aria-invalid={!!nameError} />
            {nameError && <span className="text-xs text-rose-500">{nameError}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>{t('shared.budgetTotal')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <AmountInput value={amount} onChange={(v) => { setAmount(v); if (amountError) setAmountError(null) }} placeholder="0" className="pl-7 rounded-xl bg-muted/50" />
              </div>
              {amountError && <span className="text-xs text-rose-500">{amountError}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('shared.filterMonth')}</Label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-xl bg-muted/50" />
            </div>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <DialogFooter className="pt-3 border-t border-border/40 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading} className="rounded-xl min-w-[100px]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : t('shared.addBudget')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BudgetCard({
  budget,
  groupId,
}: {
  budget: SharedBudget
  groupId: string
}) {
  const { t, locale } = useI18n()
  const [storeName, setStoreName] = useState('')
  const [storeAmount, setStoreAmount] = useState('')
  const [addingEntry, setAddingEntry] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null)
  const [deletingBudget, setDeletingBudget] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const totalSpent = budget.entries.reduce((s, e) => s + e.amount_spent, 0)
  const remaining = budget.total_amount - totalSpent
  const pct = Math.min((totalSpent / budget.total_amount) * 100, 100)

  const handleAddEntry = async () => {
    if (!storeName || !storeAmount) return
    setAddingEntry(true)
    await addSharedBudgetEntry({ budget_id: budget.id, group_id: groupId, store_name: storeName, amount_spent: storeAmount, date: new Date().toISOString().substring(0, 10) })
    setAddingEntry(false)
    setStoreName(''); setStoreAmount(''); setShowAdd(false)
  }

  const handleDeleteEntry = async (id: string) => {
    setDeletingEntry(id)
    await deleteSharedBudgetEntry(id, groupId)
    setDeletingEntry(null)
  }

  const handleDeleteBudget = async () => {
    setDeletingBudget(true)
    await deleteSharedBudget(budget.id, groupId)
    setDeletingBudget(false)
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart size={15} className="text-muted-foreground" />
              {budget.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{budget.month.substring(0, 7)}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500" onClick={handleDeleteBudget} disabled={deletingBudget}>
            {deletingBudget ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{fmt(totalSpent, locale)} {t('shared.spent')}</span>
            <span className={remaining < 0 ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}>
              {remaining >= 0 ? `${fmt(remaining, locale)} ${t('shared.remaining')}` : `${fmt(Math.abs(remaining), locale)} ${t('budgets.overspent')}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-right text-muted-foreground">{t('shared.budgetTotal')}: {fmt(budget.total_amount, locale)}</p>
        </div>
      </div>

      {/* Entries */}
      {budget.entries.length > 0 && (
        <div className="border-t border-border/20 divide-y divide-border/20">
          {budget.entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-sm">{entry.store_name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{fmt(entry.amount_spent, locale)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-rose-500"
                  onClick={() => handleDeleteEntry(entry.id)} disabled={deletingEntry === entry.id}>
                  {deletingEntry === entry.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add entry */}
      <div className="px-5 pb-4 pt-2 border-t border-border/20">
        {showAdd ? (
          <div className="flex gap-2 items-center">
            <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={t('shared.storeNamePlaceholder')} className="flex-1 h-8 text-sm rounded-lg bg-muted/50" />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
              <AmountInput value={storeAmount} onChange={setStoreAmount} placeholder="0" className="pl-5 h-8 text-sm rounded-lg bg-muted/50" />
            </div>
            <Button size="sm" className="h-8 rounded-lg px-3" onClick={handleAddEntry} disabled={addingEntry || !storeName || !storeAmount}>
              {addingEntry ? <Loader2 size={12} className="animate-spin" /> : t('shared.add')}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0" onClick={() => { setShowAdd(false); setStoreName(''); setStoreAmount('') }}>
              ✕
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-primary h-7 px-2 gap-1" onClick={() => setShowAdd(true)}>
            <Plus size={13} />
            {t('shared.addEntry')}
          </Button>
        )}
      </div>
    </div>
  )
}
