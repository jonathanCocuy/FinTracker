'use server'

import { createSupabaseServer } from './supabase-server'
import { sendBudgetAlertEmail } from './email'
import type { BudgetAlert } from './data'

/**
 * For each budget at ≥80%, attempts to insert a row in budget_alert_logs.
 * The unique constraint (budget_id, threshold, month) ensures the email is
 * sent at most once per threshold per calendar month.
 * Called fire-and-forget from getDashboardData.
 */
export async function triggerBudgetAlerts(alerts: BudgetAlert[]): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check user has opted in to email alerts
  const { data: profile } = await supabase
    .from('profiles')
    .select('email_notifications, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.email_notifications) return

  const toEmail = profile.email ?? user.email
  if (!toEmail) return

  const { data: budgetRows } = await supabase
    .from('budgets')
    .select('id, category, monthly_limit')
    .eq('user_id', user.id)

  if (!budgetRows?.length) return

  const budgetByCategory: Record<string, { id: string; monthly_limit: number }> = {}
  for (const b of budgetRows) budgetByCategory[b.category] = { id: b.id, monthly_limit: b.monthly_limit }

  const { data: catRows } = await supabase
    .from('categories')
    .select('name, label')
    .eq('user_id', user.id)

  const labelMap: Record<string, string> = {}
  for (const c of catRows ?? []) labelMap[c.name] = c.label

  const { data: profileData } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  const currency = profileData?.base_currency ?? 'COP'
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStr = monthStart.toISOString().split('T')[0]

  for (const alert of alerts) {
    if (alert.percentage < 80) continue

    const threshold = alert.percentage >= 100 ? 100 : 80
    const budget = budgetByCategory[alert.category]
    if (!budget) continue

    // Try to claim this alert slot — conflict = already sent
    const { error } = await supabase.from('budget_alert_logs').insert({
      user_id: user.id,
      budget_id: budget.id,
      threshold,
      month: monthStr,
    })

    if (error) continue // 23505 = unique violation means already sent

    await sendBudgetAlertEmail({
      toEmail,
      toName: profile.full_name ?? 'Usuario',
      categoryLabel: labelMap[alert.category] ?? alert.category,
      threshold: threshold as 80 | 100,
      spentAmount: alert.spent,
      limitAmount: budget.monthly_limit,
      currency,
    })
  }
}
