import { createSupabaseServer } from './supabase-server'
import type { DashboardAccount } from './data'

export type SharedMember = {
  id: string
  group_id: string
  name: string
  share_pct: number
  is_me: boolean
  color: string
  member_user_id: string | null
  invited_email: string | null
}

export type SharedGroup = {
  id: string
  name: string
  created_at: string
  members: SharedMember[]
}

export type SharedExpense = {
  id: string
  group_id: string
  description: string
  amount: number
  category: string
  date: string
  paid_by_member_id: string | null
  account_id: string | null
  transaction_id: string | null
  is_recurring: boolean
  notes: string | null
}

export type SharedBudgetEntry = {
  id: string
  budget_id: string
  store_name: string
  amount_spent: number
  date: string
}

export type SharedBudget = {
  id: string
  group_id: string
  name: string
  total_amount: number
  month: string
  entries: SharedBudgetEntry[]
}

export type SharedGroupDetail = {
  group: SharedGroup
  expenses: SharedExpense[]
  budgets: SharedBudget[]
  accounts: DashboardAccount[]
}

export async function getMyFullName(): Promise<string> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ''
  const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  return data?.full_name ?? ''
}

export async function getSharedGroups(): Promise<SharedGroup[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // RLS returns groups where user is owner or invited member
  const { data: groups } = await supabase
    .from('shared_groups')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (!groups?.length) return []

  const groupIds = groups.map(g => g.id)
  const { data: members } = await supabase
    .from('shared_members')
    .select('id, group_id, name, share_pct, is_me, color, member_user_id, invited_email')
    .in('group_id', groupIds)
    .order('created_at')

  return groups.map(g => ({
    ...g,
    members: (members ?? [])
      .filter(m => m.group_id === g.id)
      .map(m => ({ ...m, is_me: m.member_user_id === user.id || m.is_me })),
  }))
}

export async function getSharedGroupDetail(id: string): Promise<SharedGroupDetail | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [groupRes, membersRes, expensesRes, budgetsRes, entriesRes, accountsRes] = await Promise.all([
    supabase.from('shared_groups').select('id, name, created_at').eq('id', id).single(),
    supabase.from('shared_members').select('id, group_id, name, share_pct, is_me, color, member_user_id, invited_email').eq('group_id', id).order('created_at'),
    supabase.from('shared_expenses').select('id, group_id, description, amount, category, date, paid_by_member_id, account_id, transaction_id, is_recurring, notes').eq('group_id', id).order('date', { ascending: false }),
    supabase.from('shared_budgets').select('id, group_id, name, total_amount, month').eq('group_id', id).order('month', { ascending: false }),
    supabase.from('shared_budget_entries').select('id, budget_id, store_name, amount_spent, date').order('created_at'),
    supabase.from('accounts').select('id, name, balance, initial_balance, color').eq('user_id', user.id),
  ])

  if (!groupRes.data) return null

  const budgets: SharedBudget[] = (budgetsRes.data ?? []).map(b => ({
    ...b,
    entries: (entriesRes.data ?? []).filter(e => e.budget_id === b.id),
  }))

  const members = (membersRes.data ?? []).map(m => ({
    ...m,
    is_me: m.member_user_id === user.id || m.is_me,
  }))

  return {
    group: { ...groupRes.data, members },
    expenses: expensesRes.data ?? [],
    budgets,
    accounts: accountsRes.data ?? [],
  }
}
