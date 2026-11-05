import { createSupabaseServer } from './supabase-server'
import type { KpiItem } from '@/src/components/dashboard/kpi-cards'
import { triggerBudgetAlerts } from './budget-alert-actions'

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
  const { data: { user } } = await supabase.auth.getUser()
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
  initial_balance: number
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
  currency: string
  exchange_rate: number
  group_id: string | null
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
  created_at: string
}

export type NetWorthPoint = {
  date: string
  net_worth: number
}

export type DashboardData = {
  profile: { full_name: string; base_currency: string; show_investments: boolean } | null
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
  topInvestments: InvestmentRecord[]
  netWorthHistory: NetWorthPoint[]
  hasBudgets: boolean
  hasTransactions: boolean
}

export type TransactionsPageData = {
  transactions: DashboardTransaction[]
  accounts: DashboardAccount[]
  categories: UserCategory[]
}

export type Budget = {
  id: string
  category: string
  monthly_limit: number
  rollover_enabled: boolean
}

export type BudgetWithProgress = Budget & {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
  rollover_amount: number   // underspend carried from previous month
  effective_limit: number   // monthly_limit + rollover_amount
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { transactions: [], accounts: [], categories: [] }

  const [txRes, accountsRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, description, amount, currency, exchange_rate, category, type, date, account_id, destination_account_id, icon, group_id')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('accounts')
      .select('id, name, balance, initial_balance, color')
      .eq('user_id', user.id),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
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
    currency: tx.currency ?? 'COP',
    exchange_rate: tx.exchange_rate ?? 1,
    group_id: tx.group_id ?? null,
  }))

  return { transactions, accounts: accountsRes.data ?? [], categories: (catRes.data ?? []) as UserCategory[] }
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
    incomeVsExpensesWeekly: [],
    incomeVsExpensesMonthly: [],
    monthStats: { topSpendingDay: null, avgDailyExpense: 0, topGrowthCategory: null },
    budgetAlerts: [],
    topGoals: [],
    categories: [],
    topInvestments: [],
    netWorthHistory: [],
    hasBudgets: false,
    hasTransactions: false,
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

  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const [profileRes, accountsRes, currentTxRes, prevTxRes, chartTxRes, budgetsRes, goalsRes, categoriesRes, investmentsRes, netWorthRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, base_currency, show_investments')
      .eq('id', user.id)
      .single(),
    supabase
      .from('accounts')
      .select('id, name, balance, initial_balance, color')
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('id, description, amount, currency, exchange_rate, category, type, date, account_id, destination_account_id, icon, group_id')
      .eq('user_id', user.id)
      .gte('date', startOfCurrentMonth)
      .order('date', { ascending: false }),
    supabase
      .from('transactions')
      .select('amount, type, category, exchange_rate')
      .eq('user_id', user.id)
      .gte('date', startOfPrevMonth)
      .lte('date', endOfPrevMonth),
    supabase
      .from('transactions')
      .select('date, amount, type, exchange_rate')
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
    supabase
      .from('investment_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(4),
    supabase
      .from('net_worth_snapshots')
      .select('date, net_worth')
      .eq('user_id', user.id)
      .gte('date', twelveMonthsAgo)
      .order('date', { ascending: true }),
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

  // Upsert today's net worth snapshot (fire-and-forget, non-blocking)
  supabase.from('net_worth_snapshots')
    .upsert({ user_id: user.id, date: todayStr, net_worth: totalBalance }, { onConflict: 'user_id,date' })
    .then(() => {})

  const currentTx = currentTxRes.data ?? []
  const prevTx = prevTxRes.data ?? []

  const currentMonthIncome = currentTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount * (t.exchange_rate ?? 1), 0)
  const currentMonthExpenses = currentTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount * (t.exchange_rate ?? 1), 0)

  const prevMonthIncome = prevTx
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount * (t.exchange_rate ?? 1), 0)
  const prevMonthExpenses = prevTx
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount * (t.exchange_rate ?? 1), 0)
  // Transfers are excluded from income/expense totals — they are internal movements.

  // Estimate last month's ending balance
  const prevTotalBalance =
    totalBalance
    - (currentMonthIncome - currentMonthExpenses)
    + (prevMonthIncome - prevMonthExpenses)

  // Format transactions for the table
  const transactions: DashboardTransaction[] = currentTx.map(tx => ({
    id: tx.id,
    date: tx.date ?? '',
    rawDate: tx.date ?? '',
    category: tx.category,
    description: tx.description,
    icon: tx.icon ?? '',
    amount: tx.amount,
    type: tx.type as 'income' | 'expense' | 'transfer',
    account_id: tx.account_id,
    destination_account_id: (tx as { destination_account_id?: string | null }).destination_account_id ?? null,
    currency: (tx as { currency?: string }).currency ?? 'COP',
    exchange_rate: (tx as { exchange_rate?: number }).exchange_rate ?? 1,
    group_id: (tx as { group_id?: string | null }).group_id ?? null,
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
      weekTotals[idx] += tx.amount * ((tx as { exchange_rate?: number }).exchange_rate ?? 1)
    })

  const barChartData = weekTotals.map((value, dayIndex) => ({ dayIndex, value }))

  // Donut: expense totals by category this month
  const catTotals: Record<string, number> = {}
  currentTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      catTotals[tx.category] = (catTotals[tx.category] ?? 0) + tx.amount * ((tx as { exchange_rate?: number }).exchange_rate ?? 1)
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
      const converted = tx.amount * (tx.exchange_rate ?? 1)
      if (tx.type === 'income') entry.ingresos += converted
      else entry.gastos += converted
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
      const converted = tx.amount * (tx.exchange_rate ?? 1)
      if (tx.type === 'income') entry.ingresos += converted
      else entry.gastos += converted
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
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + tx.amount * ((tx as { exchange_rate?: number }).exchange_rate ?? 1))
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
    .forEach(tx => { prevCatMap.set(tx.category, (prevCatMap.get(tx.category) ?? 0) + tx.amount * (tx.exchange_rate ?? 1)) })
  const currCatMap = new Map<string, number>()
  currentTx
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { currCatMap.set(tx.category, (currCatMap.get(tx.category) ?? 0) + tx.amount * ((tx as { exchange_rate?: number }).exchange_rate ?? 1)) })
  let topGrowthCategory: { category: string; growth: number } | null = null
  currCatMap.forEach((curr, cat) => {
    const growth = curr - (prevCatMap.get(cat) ?? 0)
    if (growth > 0 && (!topGrowthCategory || growth > topGrowthCategory.growth)) {
      topGrowthCategory = { category: cat, growth }
    }
  })

  const monthStats: MonthStats = { topSpendingDay, avgDailyExpense, topGrowthCategory }

  const result = {
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
    topInvestments: (investmentsRes.data ?? []) as InvestmentRecord[],
    netWorthHistory: (netWorthRes.data ?? []) as NetWorthPoint[],
    hasBudgets: (budgetsRes.data?.length ?? 0) > 0,
    hasTransactions: (currentTxRes.data?.length ?? 0) > 0,
  }

  // Fire-and-forget: send budget alert emails for thresholds reached this month.
  // The budget_alert_logs unique constraint prevents duplicate sends.
  void triggerBudgetAlerts(result.budgetAlerts)

  return result
}

export async function getBudgetsData(): Promise<BudgetsPageData> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { budgets: [], categories: [] }

  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0]
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString().split('T')[0]
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString().split('T')[0]

  const [budgetsRes, txRes, prevTxRes, categoriesRes] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, category, monthly_limit, rollover_enabled')
      .eq('user_id', user.id)
      .order('category'),
    supabase
      .from('transactions')
      .select('category, amount, exchange_rate')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', startOfCurrentMonth),
    supabase
      .from('transactions')
      .select('category, amount, exchange_rate')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', startOfPrevMonth)
      .lte('date', endOfPrevMonth),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  const spentByCategory: Record<string, number> = {}
  for (const tx of txRes.data ?? []) {
    spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount * (tx.exchange_rate ?? 1)
  }

  const prevSpentByCategory: Record<string, number> = {}
  for (const tx of prevTxRes.data ?? []) {
    prevSpentByCategory[tx.category] = (prevSpentByCategory[tx.category] ?? 0) + tx.amount * (tx.exchange_rate ?? 1)
  }

  const budgets: BudgetWithProgress[] = (budgetsRes.data ?? []).map(b => {
    const rollover_amount = b.rollover_enabled
      ? Math.max(0, b.monthly_limit - (prevSpentByCategory[b.category] ?? 0))
      : 0
    const effective_limit = b.monthly_limit + rollover_amount
    const spent = spentByCategory[b.category] ?? 0
    const remaining = effective_limit - spent
    const percentage = effective_limit > 0 ? (spent / effective_limit) * 100 : 0
    return {
      id: b.id,
      category: b.category,
      monthly_limit: b.monthly_limit,
      rollover_enabled: b.rollover_enabled ?? false,
      rollover_amount,
      effective_limit,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > effective_limit,
    }
  })

  return { budgets, categories: categoriesRes.data ?? [] }
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
  currency: string
}

export type RecurringPageData = {
  templates: RecurringTemplate[]
  accounts: DashboardAccount[]
  categories: UserCategory[]
}

export async function getRecurringData(): Promise<RecurringPageData> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { templates: [], accounts: [], categories: [] }

  // Auto-generate any due recurring transactions on page visit
  await supabase.rpc('process_recurring_transactions', { p_user_id: user.id })

  const [templatesRes, accountsRes, categoriesRes] = await Promise.all([
    supabase
      .from('recurring_templates')
      .select('id, description, icon, amount, currency, category, type, interval, day_of_month, day_of_week, last_generated_date, is_active, account_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('accounts')
      .select('id, name, balance, initial_balance, color')
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

// ─── Investments ──────────────────────────────────────────────────────────────

export type InvestmentRecord = {
  id: string
  user_id: string
  name: string
  type: 'etf' | 'stock' | 'crypto' | 'fund' | 'other'
  amount: number
  currency: 'COP' | 'USD'
  date: string
  notes: string | null
  created_at: string
}

export async function getInvestmentsData(): Promise<InvestmentRecord[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('investment_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return (data ?? []) as InvestmentRecord[]
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type MonthlyReportRow = {
  month: number      // 1–12
  income: number
  expenses: number
  savings: number
}

export type CategoryReportRow = {
  category: string
  total: number
  color: string
}

export type ReportsData = {
  year: number
  availableYears: number[]
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  savingsRate: number
  monthly: MonthlyReportRow[]
  topCategories: CategoryReportRow[]
  categories: UserCategory[]
}

export async function getReportsData(year?: number): Promise<ReportsData> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const empty = (y: number): ReportsData => ({
    year: y, availableYears: [y],
    totalIncome: 0, totalExpenses: 0, totalSavings: 0, savingsRate: 0,
    monthly: [], topCategories: [], categories: [],
  })

  if (!user) return empty(new Date().getFullYear())

  // Get the range of years from transactions
  const { data: yearsData } = await supabase
    .from('transactions')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
    .limit(1)

  const { data: yearsDataLast } = await supabase
    .from('transactions')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)

  const thisYear = new Date().getFullYear()
  const firstYear = yearsData?.[0]?.date ? new Date(yearsData[0].date).getFullYear() : thisYear
  const lastYear = yearsDataLast?.[0]?.date ? new Date(yearsDataLast[0].date).getFullYear() : thisYear
  const availableYears = Array.from(
    { length: Math.max(lastYear, thisYear) - Math.min(firstYear, thisYear) + 1 },
    (_, i) => Math.min(firstYear, thisYear) + i
  ).reverse()

  const selectedYear = year ?? thisYear
  const start = `${selectedYear}-01-01`
  const end = `${selectedYear}-12-31`

  const [txRes, categoriesRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('date, amount, type, category, exchange_rate')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .neq('type', 'transfer'),
    supabase
      .from('categories')
      .select('id, name, label, color, icon')
      .eq('user_id', user.id)
      .order('created_at'),
  ])

  const categoryColorMap: Record<string, string> = {}
  for (const c of categoriesRes.data ?? []) {
    categoryColorMap[c.name] = c.color
  }

  const monthlyMap: Record<number, { income: number; expenses: number }> = {}
  for (let m = 1; m <= 12; m++) monthlyMap[m] = { income: 0, expenses: 0 }

  const categoryTotals: Record<string, number> = {}
  let totalIncome = 0
  let totalExpenses = 0

  for (const tx of txRes.data ?? []) {
    const m = new Date(tx.date).getMonth() + 1
    const amount = tx.amount * (tx.exchange_rate ?? 1)
    if (tx.type === 'income') {
      monthlyMap[m].income += amount
      totalIncome += amount
    } else {
      monthlyMap[m].expenses += amount
      totalExpenses += amount
      categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + amount
    }
  }

  const monthly: MonthlyReportRow[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const { income, expenses } = monthlyMap[m]
    return { month: m, income, expenses, savings: income - expenses }
  })

  const topCategories: CategoryReportRow[] = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, total]) => ({
      category,
      total,
      color: categoryColorMap[category] ?? '#94a3b8',
    }))

  const totalSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  return {
    year: selectedYear,
    availableYears,
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    monthly,
    topCategories,
    categories: categoriesRes.data ?? [],
  }
}

export async function getGoalsData(): Promise<SavingsGoal[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const res = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('deadline', { ascending: true })

  return res.data ?? []
}
