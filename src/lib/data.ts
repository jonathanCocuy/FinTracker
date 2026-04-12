import { createSupabaseServer } from './supabase-server'
import type { KpiItem } from '@/src/components/dashboard/kpi-cards'

export type DashboardAccount = {
  id: string
  name: string
  balance: number
  color: string
}

export type DashboardTransaction = {
  id: string
  date: string        // formatted for display
  rawDate: string     // ISO string for editing
  category: string
  description: string
  icon: string
  amount: number
  type: 'income' | 'expense'
  account_id: string
}

export type DashboardData = {
  profile: { full_name: string } | null
  accounts: DashboardAccount[]
  totalBalance: number
  prevTotalBalance: number
  currentMonthIncome: number
  currentMonthExpenses: number
  prevMonthIncome: number
  prevMonthExpenses: number
  transactions: DashboardTransaction[]
  // dayIndex: 0=Mon … 6=Sun
  barChartData: { dayIndex: number; value: number }[]
  // raw category key for client-side translation + color mapping
  donutData: { category: string; value: number }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const empty: DashboardData = {
    profile: null,
    accounts: [],
    totalBalance: 0,
    prevTotalBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpenses: 0,
    prevMonthIncome: 0,
    prevMonthExpenses: 0,
    transactions: [],
    barChartData: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, value: 0 })),
    donutData: [],
  }

  if (!user) return empty

  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString().split('T')[0]
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString().split('T')[0]

  const [profileRes, accountsRes, currentTxRes, prevTxRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('accounts')
      .select('id, name, balance, color')
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('id, description, amount, category, type, date, account_id, icon')
      .eq('user_id', user.id)
      .gte('date', startOfCurrentMonth)
      .order('date', { ascending: false }),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('date', startOfPrevMonth)
      .lte('date', endOfPrevMonth),
  ])

  const accounts: DashboardAccount[] = accountsRes.data ?? []
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0)

  const currentTx = currentTxRes.data ?? []
  const prevTx = prevTxRes.data ?? []

  const currentMonthIncome = currentTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const currentMonthExpenses = currentTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const prevMonthIncome = prevTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const prevMonthExpenses = prevTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  // Estimate last month's ending balance
  const prevTotalBalance =
    totalBalance
    - (currentMonthIncome - currentMonthExpenses)
    + (prevMonthIncome - prevMonthExpenses)

  // Format transactions for the table
  const transactions: DashboardTransaction[] = currentTx.map(tx => ({
    id: tx.id,
    date: formatTxDate(tx.date),
    rawDate: tx.date ?? '',
    category: tx.category,
    description: tx.description,
    icon: tx.icon ?? '',
    amount: tx.amount,
    type: tx.type as 'income' | 'expense',
    account_id: tx.account_id,
  }))

  // Bar chart: expenses per weekday for the current week (Mon–Sun)
  const dayOfWeek = now.getDay()                        // 0=Sun … 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysFromMonday)
  weekStart.setHours(0, 0, 0, 0)

  const weekTotals = new Array(7).fill(0)               // index 0=Mon … 6=Sun
  currentTx
    .filter(tx => tx.type === 'expense' && new Date(tx.date + 'T00:00:00') >= weekStart)
    .forEach(tx => {
      const d = new Date(tx.date + 'T00:00:00').getDay() // 0=Sun
      const idx = d === 0 ? 6 : d - 1
      weekTotals[idx] += tx.amount
    })

  const barChartData = weekTotals.map((value, dayIndex) => ({ dayIndex, value }))

  // Donut: expense totals by category this month
  const catTotals: Record<string, number> = {}
  currentTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      catTotals[tx.category] = (catTotals[tx.category] ?? 0) + tx.amount
    })

  const donutData = Object.entries(catTotals)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)

  return {
    profile: profileRes.data,
    accounts,
    totalBalance,
    prevTotalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    prevMonthIncome,
    prevMonthExpenses,
    transactions,
    barChartData,
    donutData,
  }
}

function formatTxDate(dateStr: string): string {
  if (!dateStr) return '-'

  // Works with both "YYYY-MM-DD" and full ISO timestamps (timestamptz)
  const datePart = dateStr.substring(0, 10)
  const date = new Date(datePart + 'T00:00:00Z')

  if (isNaN(date.getTime())) return '-'

  const now = new Date()
  const todayPart = now.toISOString().substring(0, 10)

  if (datePart === todayPart) return 'Hoy'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (datePart === yesterday.toISOString().substring(0, 10)) return 'Ayer'

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
