"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { useI18n } from "@/src/lib/i18n"
import { settleSharedBalance } from "@/src/lib/shared-actions"
import { Loader2, HandCoins, ArrowDown, ArrowUp } from "lucide-react"
import type { SharedMember, SharedExpense, SharedGroupDetail } from "@/src/lib/shared-data"

type MemberBalance = {
  member: SharedMember
  paid: number
  shouldPay: number
  balance: number
}

function fmt(n: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

export function SettlementModal({
  open,
  onOpenChange,
  groupId,
  members,
  expenses,
  accounts,
  monthFilter,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  groupId: string
  members: SharedMember[]
  expenses: SharedExpense[]
  accounts: SharedGroupDetail['accounts']
  monthFilter: string
}) {
  const { t, locale } = useI18n()
  const [loading, setLoading] = useState<string | null>(null)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filtered = monthFilter === 'all'
    ? expenses
    : expenses.filter(e => e.date.substring(0, 7) === monthFilter)

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0)

  const balances: MemberBalance[] = members.map(member => {
    const paid = filtered.filter(e => e.paid_by_member_id === member.id).reduce((s, e) => s + e.amount, 0)
    const shouldPay = totalExpenses * member.share_pct / 100
    const balance = paid - shouldPay
    return { member, paid, shouldPay, balance }
  })

  const myMember = members.find(m => m.is_me)
  const myBalance = balances.find(b => b.member.is_me)

  const handleSettle = async (otherMember: SharedMember, amount: number, isIncome: boolean) => {
    setLoading(otherMember.id)
    setSubmitError(null)
    const description = isIncome
      ? `${t('shared.settlementFrom')} ${otherMember.name}`
      : `${t('shared.settlementTo')} ${otherMember.name}`
    const res = await settleSharedBalance({ group_id: groupId, amount: Math.abs(amount).toString(), account_id: accountId, is_income: isIncome, description })
    setLoading(null)
    if (res.error) { setSubmitError(res.error); return }
    onOpenChange(false)
  }

  if (!myMember || !myBalance) return null

  const others = balances.filter(b => !b.member.is_me)

  return (
    <Dialog open={open} onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <HandCoins size={18} />
              </div>
              {t('shared.settlement')}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* Summary table */}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-2">
              <span>{t('shared.members')}</span>
              <span className="text-right">{t('shared.paid')}</span>
              <span className="text-right">{t('shared.balance')}</span>
            </div>
            {balances.map(b => (
              <div key={b.member.id} className="grid grid-cols-3 px-3 py-2.5 border-t border-border/20 items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.member.color }} />
                  <span className="text-sm font-medium">{b.member.name}</span>
                  {b.member.is_me && <span className="text-xs text-primary">({t('shared.me')})</span>}
                </div>
                <span className="text-sm text-right">{fmt(b.paid, locale)}</span>
                <span className={`text-sm text-right font-semibold ${b.balance > 0 ? 'text-emerald-500' : b.balance < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {b.balance > 0 ? '+' : ''}{fmt(b.balance, locale)}
                </span>
              </div>
            ))}
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm">{t('common.account')}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="rounded-xl bg-muted/50">
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
            </div>
          )}

          {/* Settle buttons */}
          <div className="flex flex-col gap-2">
            {others.map(b => {
              const amountOwed = myBalance.balance > 0
                ? Math.min(myBalance.balance, Math.abs(Math.min(b.balance, 0)))
                : 0
              const amountIOwe = myBalance.balance < 0
                ? Math.min(Math.abs(myBalance.balance), Math.max(b.balance, 0))
                : 0

              if (amountOwed === 0 && amountIOwe === 0) {
                return (
                  <div key={b.member.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.member.color }} />
                    <span className="text-sm text-muted-foreground">{b.member.name} · {t('shared.nothingToSettle')}</span>
                  </div>
                )
              }

              if (amountOwed > 0) {
                return (
                  <div key={b.member.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <ArrowDown size={14} className="text-emerald-500" />
                      <span className="text-sm">
                        <span style={{ color: b.member.color }} className="font-semibold">{b.member.name}</span>
                        {' '}{t('shared.owesYou')}{' '}
                        <span className="font-bold text-emerald-600">{fmt(amountOwed, locale)}</span>
                      </span>
                    </div>
                    <Button size="sm" className="rounded-xl h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                      disabled={!!loading || !accountId}
                      onClick={() => handleSettle(b.member, amountOwed, true)}>
                      {loading === b.member.id ? <Loader2 size={12} className="animate-spin" /> : t('shared.settled')}
                    </Button>
                  </div>
                )
              }

              return (
                <div key={b.member.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2">
                    <ArrowUp size={14} className="text-rose-500" />
                    <span className="text-sm">
                      {t('shared.youOwe')}{' '}
                      <span style={{ color: b.member.color }} className="font-semibold">{b.member.name}</span>
                      {' '}<span className="font-bold text-rose-600">{fmt(amountIOwe, locale)}</span>
                    </span>
                  </div>
                  <Button size="sm" variant="destructive" className="rounded-xl h-8"
                    disabled={!!loading || !accountId}
                    onClick={() => handleSettle(b.member, amountIOwe, false)}>
                    {loading === b.member.id ? <Loader2 size={12} className="animate-spin" /> : t('shared.settled')}
                  </Button>
                </div>
              )
            })}
          </div>

          {submitError && <p className="text-xs text-rose-500 text-center">{submitError}</p>}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl w-full">{t('common.cancel')}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
