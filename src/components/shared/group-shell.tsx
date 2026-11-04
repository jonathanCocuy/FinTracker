"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { useI18n } from "@/src/lib/i18n"
import { GroupModal } from "./group-modal"
import { SharedExpenseModal } from "./shared-expense-modal"
import { SettlementModal } from "./settlement-modal"
import { SharedBudgetCreateModal, BudgetCard } from "./shared-budget-modal"
import { Users, ChevronLeft, Plus, HandCoins, Edit, ShoppingCart } from "lucide-react"
import type { SharedGroupDetail, SharedExpense } from "@/src/lib/shared-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"

const EXPENSE_CATEGORIES = [
  'home', 'rent', 'utilities', 'groceries', 'transport', 'health',
  'entertainment', 'dining', 'clothing', 'education', 'other',
]

function fmt(n: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export function GroupShell({ detail }: { detail: SharedGroupDetail }) {
  const { t, locale } = useI18n()
  const { group, expenses, budgets, accounts } = detail

  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<SharedExpense | undefined>()
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [monthFilter, setMonthFilter] = useState('all')

  const categories = EXPENSE_CATEGORIES.map(c => ({ name: c, label: t(`categories.${c}` as never) || c }))

  // Get available months from expenses
  const months = Array.from(new Set(expenses.map(e => e.date.substring(0, 7)))).sort().reverse()

  const filteredExpenses = monthFilter === 'all'
    ? expenses
    : expenses.filter(e => e.date.substring(0, 7) === monthFilter)

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  const myMember = group.members.find(m => m.is_me)
  const mySharePct = myMember?.share_pct ?? 0

  // Per-member totals
  const memberTotals = group.members.map(member => {
    const paid = filteredExpenses.filter(e => e.paid_by_member_id === member.id).reduce((s, e) => s + e.amount, 0)
    const shouldPay = totalExpenses * member.share_pct / 100
    const balance = paid - shouldPay
    return { member, paid, shouldPay, balance }
  })

  const myBalance = memberTotals.find(m => m.member.is_me)

  return (
    <div className="flex flex-col gap-6 w-full">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/shared">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                <ChevronLeft size={16} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setGroupModalOpen(true)}>
                  <Edit size={14} className="text-muted-foreground" />
                </Button>
              </div>
              <div className="flex gap-2 mt-1 flex-wrap">
                {group.members.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name} · {m.share_pct}%
                    {m.is_me && <span className="text-primary font-medium">({t('shared.me')})</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setSettlementOpen(true)}>
              <HandCoins size={14} />
              {t('shared.settle')}
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => { setEditingExpense(undefined); setExpenseModalOpen(true) }}>
              <Plus size={14} />
              {t('shared.addExpense')}
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">{t('shared.totalExpenses')}</p>
            <p className="text-lg font-bold">{fmt(totalExpenses, locale)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">{t('shared.myShare')} ({mySharePct}%)</p>
            <p className="text-lg font-bold">{fmt(totalExpenses * mySharePct / 100, locale)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">{t('shared.myPaid')}</p>
            <p className="text-lg font-bold">{fmt(myBalance?.paid ?? 0, locale)}</p>
          </div>
          <div className={`p-4 rounded-2xl border ${(myBalance?.balance ?? 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <p className="text-xs text-muted-foreground mb-1">{t('shared.myBalance')}</p>
            <p className={`text-lg font-bold ${(myBalance?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(myBalance?.balance ?? 0) >= 0 ? '+' : ''}{fmt(myBalance?.balance ?? 0, locale)}
            </p>
          </div>
        </div>

        {/* Expenses section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            {t('shared.expenses')} ({filteredExpenses.length})
          </h2>
          <div className="flex items-center gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-8 rounded-xl text-sm bg-muted/50 border-border/40 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{t('shared.allTime')}</SelectItem>
                {months.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border/40">
            <Users size={28} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">{t('shared.noExpenses')}</p>
            <Button variant="outline" size="sm" className="rounded-xl mt-3" onClick={() => { setEditingExpense(undefined); setExpenseModalOpen(true) }}>
              <Plus size={13} className="mr-1" />{t('shared.addExpense')}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden mb-6">
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs text-muted-foreground font-medium bg-muted/30 px-5 py-2.5 gap-4">
              <span>{t('common.description')}</span>
              <span className="text-right hidden sm:block">{t('shared.paidBy')}</span>
              <span className="text-right">{t('common.amount')}</span>
              <span className="text-right">{t('shared.myPart')}</span>
            </div>
            <div className="divide-y divide-border/20">
              {filteredExpenses.map(expense => {
                const payer = group.members.find(m => m.id === expense.paid_by_member_id)
                const myPart = expense.amount * mySharePct / 100
                return (
                  <button
                    key={expense.id}
                    className="w-full grid grid-cols-[1fr_auto_auto_auto] px-5 py-3 gap-4 items-center hover:bg-muted/20 transition-colors text-left"
                    onClick={() => { setEditingExpense(expense); setExpenseModalOpen(true) }}
                  >
                    <div>
                      <p className="text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.date} · {expense.category}{expense.is_recurring ? ' ·  🔁' : ''}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      {payer && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payer.color }} />}
                      <span className="text-xs text-muted-foreground">{payer?.name ?? '—'}</span>
                    </div>
                    <span className="text-sm font-medium text-right">{fmt(expense.amount, locale)}</span>
                    <span className="text-sm text-right text-muted-foreground">{fmt(myPart, locale)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Budgets section */}
        <div className="flex items-center justify-between mb-3 mt-8">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart size={16} className="text-muted-foreground" />
            {t('shared.budgets')} ({budgets.length})
          </h2>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setBudgetModalOpen(true)}>
            <Plus size={13} />
            {t('shared.addBudget')}
          </Button>
        </div>

        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border/40">
            <ShoppingCart size={28} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">{t('shared.noBudgets')}</p>
            <Button variant="outline" size="sm" className="rounded-xl mt-3" onClick={() => setBudgetModalOpen(true)}>
              <Plus size={13} className="mr-1" />{t('shared.addBudget')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {budgets.map(budget => (
              <BudgetCard key={budget.id} budget={budget} groupId={group.id} />
            ))}
          </div>
        )}


      <GroupModal open={groupModalOpen} onOpenChange={setGroupModalOpen} group={group} />

      <SharedExpenseModal
        open={expenseModalOpen}
        onOpenChange={(v) => { setExpenseModalOpen(v); if (!v) setEditingExpense(undefined) }}
        groupId={group.id}
        members={group.members}
        accounts={accounts}
        categories={categories}
        expense={editingExpense}
      />

      <SettlementModal
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        groupId={group.id}
        members={group.members}
        expenses={expenses}
        accounts={accounts}
        monthFilter={monthFilter}
      />

      <SharedBudgetCreateModal
        open={budgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        groupId={group.id}
      />
    </div>
  )
}
