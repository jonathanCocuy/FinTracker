import { createSupabaseServer } from './supabase-server'
import type { KpiItem } from '@/src/components/dashboard/kpi-cards'

export type UserCategory = {
  id: string
  name: string
  label: string
  color: string
  icon: string
}

const DEFAULT_CATEGORIES: Omit<UserCategory, 'id'>[] = [
  { name: 'food',          label: 'Alimentación', color: '#f97316', icon: 'Utensils' },
  { name: 'home',          label: 'Hogar',        color: '#3b82f6', icon: 'Home' },
  { name: 'transport',     label: 'Transporte',   color: '#8b5cf6', icon: 'Car' },
  { name: 'health',        label: 'Salud',        color: '#ef4444', icon: 'Heart' },
  { name: 'leisure',       label: 'Ocio',         color: '#fbbf24', icon: 'Gamepad2' },
  { name: 'income',        label: 'Ingreso',      color: '#22c55e', icon: 'TrendingUp' },
]

export async function getCategories(): Promise<UserCategory[]> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data } = await supabase
    .from('categories')
    .select('id, name, label, color, icon')
    .eq('user_id', user.id)
    .order('created_at')

  if (!data || data.length === 0) {
    await supabase.from('categories').upsert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
      { onConflict: 'user_id,name' }
    )
    const { data: seeded } = await supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at')
    return seeded ?? []
  }

  return data
}

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
  type: 'income' | 'expense' | 'transfer'
  account_id: string
  destination_account_id: string | null
}

export type IncomeExpensePoint = {
  period: string   // "YYYY-MM-DD" for weekly, "YYYY-MM-01" for monthly
  ingresos: number
  gastos: number
}

export type MonthStats = {
  topSpendingDay: { date: string; total: number } | null
  avgDailyExpense: number
  topGrowthCategory: { category: string; growth: number } | null
}

export type SavingsGoal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string | null
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
  incomeVsExpensesWeekly: IncomeExpensePoint[]
  incomeVsExpensesMonthly: IncomeExpensePoint[]
  monthStats: MonthStats
  budgetAlerts: BudgetAlert[]
  topGoals: SavingsGoal[]
  categories: UserCategory[]
}

export type TransactionsPageData = {
  transactions: DashboardTransaction[]
  accounts: DashboardAccount[]
}

export type Budget = {
  id: string
  category: string
  monthly_limit: number
}

export type BudgetWithProgress = Budget & {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

export type BudgetsPageData = {
  budgets: BudgetWithProgress[]
  categories: UserCategory[]
}

export type BudgetAlert = {
  category: string
  spent: number
  limit: number
  percentage: number
  isOver: boolean
}

export async function getTransactionsData(): Promise<TransactionsPageData> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { transactions: [], accounts: [] }

  const [txRes, accountsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, description, amount, category, type, date, account_id, destination_account_id, icon')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('accounts')
      .select('id, name, balance, color')
      .eq('user_id', user.id),
  ])

  const transactions: DashboardTransaction[] = (txRes.data ?? []).map(tx => ({
    id: tx.id,
    date: tx.date ?? '',
    rawDate: tx.date ?? '',
    category: tx.category,
    description: tx.description,
    icon: tx.icon ?? '',
    amount: tx.amount,
    type: tx.type as 'income' | 'expense' | 'transfer',
    account_id: tx.account_id,
    destination_account_id: tx.destination_account_id ?? null,
  }))

  return { transactions, accounts: accountsRes.data ?? [] }
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

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
    incomeVsExpensesWeekly: [],
    incomeVsExpensesMonthly: [],
    monthStats: { topSpendingDay: null, avgDailyExpense: 0, topGrowthCategory: null },
    budgetAlerts: [],
    topGoals: [],
    categories: [],
  }

  if (!user) return empty

  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString().split('T')[0]
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString().split('T')[0]

  const sixMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sixMonthsAgo = `${sixMonthsAgoDate.getFullYear()}-${String(sixMonthsAgoDate.getMonth() + 1).padStart(2, '0')}-01`

  const [profileRes, accountsRes, currentTxRes, prevTxRes, chartTxRes, budgetsRes, goalsRes, categoriesRes] = await Promise.all([
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
      .select('id, description, amount, category, type, date, account_id, destination_account_id, icon')
      .eq('user_id', user.id)
      .gte('date', startOfCurrentMonth)
      .order('date', { ascending: false }),
    supabase
      .from('transactions')
      .select('amount, type, category')
      .eq('user_id', user.id)
      .gte('date', startOfPrevMonth)
      .lte('date', endOfPrevMonth),
    supabase
      .from('transactions')
      .select('date, amount, type')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgo)
      .order('date', { ascending: true }),
    supabase
      .from('budgets')
      .select('category, monthly_limit')
      .eq('user_id', user.id),
    supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  let categories: UserCategory[] = categoriesRes.data ?? []
  if (categories.length === 0) {
    await supabase.from('categories').upsert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id })),
      { onConflict: 'user_id,name' }
    )
    const { data: seeded } = await supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at')
    categories = seeded ?? []
  }

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
  // Transfers are excluded from income/expense totals — they are internal movements.

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
    type: tx.type as 'income' | 'expense' | 'transfer',
    account_id: tx.account_id,
    destination_account_id: (tx as { destination_account_id?: string | null }).destination_account_id ?? null,
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

  // Budget alerts
  const budgetAlerts: BudgetAlert[] = (budgetsRes.data ?? [])
    .map(b => {
      const spent = catTotals[b.category] ?? 0
      const limit = b.monthly_limit
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      return { category: b.category, spent, limit, percentage, isOver: spent > limit }
    })
    .sort((a, b) => b.percentage - a.percentage)

  const allGoals: SavingsGoal[] = goalsRes.data ?? []
  const topGoals = allGoals
    .filter(g => g.current_amount < g.target_amount)
    .slice(0, 2)

  // Income vs Expenses — weekly (last 7 days) and monthly (last 6 months)
  const chartTx = chartTxRes.data ?? []

  const weeklyMap = new Map<string, { ingresos: number; gastos: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    weeklyMap.set(key, { ingresos: 0, gastos: 0 })
  }
  chartTx.forEach(tx => {
    if (tx.type === 'transfer') return
    const day = tx.date.substring(0, 10)
    const entry = weeklyMap.get(day)
    if (entry) {
      if (tx.type === 'income') entry.ingresos += tx.amount
      else entry.gastos += tx.amount
    }
  })
  const incomeVsExpensesWeekly = Array.from(weeklyMap.entries())
    .map(([period, vals]) => ({ period, ...vals }))

  const monthlyMap = new Map<string, { ingresos: number; gastos: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    monthlyMap.set(key, { ingresos: 0, gastos: 0 })
  }
  chartTx.forEach(tx => {
    if (tx.type === 'transfer') return
    const monthKey = tx.date.substring(0, 7) + '-01'
    const entry = monthlyMap.get(monthKey)
    if (entry) {
      if (tx.type === 'income') entry.ingresos += tx.amount
      else entry.gastos += tx.amount
    }
  })
  const incomeVsExpensesMonthly = Array.from(monthlyMap.entries())
    .map(([period, vals]) => ({ period, ...vals }))

  // Month stats
  const dailyTotals = new Map<string, number>()
  currentTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      const day = tx.date.substring(0, 10)
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + tx.amount)
    })
  let topSpendingDay: { date: string; total: number } | null = null
  dailyTotals.forEach((total, date) => {
    if (!topSpendingDay || total > topSpendingDay.total) topSpendingDay = { date, total }
  })

  const daysElapsed = now.getDate()
  const avgDailyExpense = daysElapsed > 0 ? currentMonthExpenses / daysElapsed : 0

  const prevCatMap = new Map<string, number>()
  prevTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { prevCatMap.set(tx.category, (prevCatMap.get(tx.category) ?? 0) + tx.amount) })
  const currCatMap = new Map<string, number>()
  currentTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { currCatMap.set(tx.category, (currCatMap.get(tx.category) ?? 0) + tx.amount) })
  let topGrowthCategory: { category: string; growth: number } | null = null
  currCatMap.forEach((curr, cat) => {
    const growth = curr - (prevCatMap.get(cat) ?? 0)
    if (growth > 0 && (!topGrowthCategory || growth > topGrowthCategory.growth)) {
      topGrowthCategory = { category: cat, growth }
    }
  })

  const monthStats: MonthStats = { topSpendingDay, avgDailyExpense, topGrowthCategory }

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
    incomeVsExpensesWeekly,
    incomeVsExpensesMonthly,
    monthStats,
    budgetAlerts,
    topGoals,
    categories,
  }
}

export async function getBudgetsData(): Promise<BudgetsPageData> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { budgets: [], categories: [] }

  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]

  const [budgetsRes, txRes, categoriesRes] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, category, monthly_limit')
      .eq('user_id', user.id)
      .order('category'),
    supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', startOfCurrentMonth),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  const spentByCategory: Record<string, number> = {}
  for (const tx of txRes.data ?? []) {
    spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount
  }

  const budgets: BudgetWithProgress[] = (budgetsRes.data ?? []).map(b => {
    const spent = spentByCategory[b.category] ?? 0
    const remaining = b.monthly_limit - spent
    const percentage = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0
    return {
      id: b.id,
      category: b.category,
      monthly_limit: b.monthly_limit,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > b.monthly_limit,
    }
  })

  return { budgets, categories: categoriesRes.data ?? [] }
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

// ─── Recurring Templates ──────────────────────────────────────────────────────

export type RecurringTemplate = {
  id: string
  description: string
  icon: string
  amount: number
  category: string
  type: 'income' | 'expense'
  interval: 'monthly' | 'weekly'
  day_of_month: number | null
  day_of_week: number | null
  last_generated_date: string | null
  is_active: boolean
  account_id: string
}

export type RecurringPageData = {
  templates: RecurringTemplate[]
  accounts: DashboardAccount[]
  categories: UserCategory[]
}

export async function getRecurringData(): Promise<RecurringPageData> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { templates: [], accounts: [], categories: [] }

  const [templatesRes, accountsRes, categoriesRes] = await Promise.all([
    supabase
      .from('recurring_templates')
      .select('id, description, icon, amount, category, type, interval, day_of_month, day_of_week, last_generated_date, is_active, account_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('accounts')
      .select('id, name, balance, color')
      .eq('user_id', user.id),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  return {
    templates: (templatesRes.data ?? []) as RecurringTemplate[],
    accounts: accountsRes.data ?? [],
    categories: categoriesRes.data ?? [],
  }
}

export async function getGoalsData(): Promise<SavingsGoal[]> {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const res = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('deadline', { ascending: true })

  return res.data ?? []
}
