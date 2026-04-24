'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from './supabase-server'

const createTransactionSchema = z.object({
  icon: z.string().min(1),
  description: z.string().min(2),
  amount: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(['income', 'expense']),
  date: z.string(),        // ISO string serialized from client Date
  account_id: z.string().min(1),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ success?: true; error?: string }> {
  const parsed = createTransactionSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { icon, description, amount, category, type, date, account_id } = parsed.data

  // Validamos que la fecha sea real, si no, usamos la fecha de hoy
  const validDate = date && !isNaN(new Date(date).getTime()) 
    ? new Date(date).toISOString() 
    : new Date().toISOString();

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id,
    description,
    icon,
    amount: parseFloat(amount),
    category,
    type,
    date: validDate, 
  });

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── createAccount ────────────────────────────────────────────────────────────

const createAccountSchema = z.object({
  name: z.string().min(2),
  balance: z.string().min(1),
  color: z.string().min(1),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>

export async function createAccount(
  input: CreateAccountInput
): Promise<{ success?: true; error?: string }> {
  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { name, balance, color } = parsed.data

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name,
    balance: parseFloat(balance),
    color,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── updateAccount ────────────────────────────────────────────────────────────

const updateAccountSchema = z.object({
  name: z.string().min(2),
  balance: z.string().min(1),
  color: z.string().min(1),
})

export async function updateAccount(
  id: string,
  input: z.infer<typeof updateAccountSchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = updateAccountSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('accounts')
    .update({ name: parsed.data.name, balance: parseFloat(parsed.data.balance), color: parsed.data.color })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── deleteAccount ────────────────────────────────────────────────────────────

export async function deleteAccount(
  id: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── updateTransaction ────────────────────────────────────────────────────────

const updateTransactionSchema = z.object({
  icon: z.string().min(1),
  description: z.string().min(2),
  amount: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(['income', 'expense']),
  date: z.string(),
  account_id: z.string().min(1),
})

export async function updateTransaction(
  id: string,
  input: z.infer<typeof updateTransactionSchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = updateTransactionSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { icon, description, amount, category, type, date, account_id } = parsed.data
  const validDate = date && !isNaN(new Date(date).getTime())
    ? new Date(date).toISOString()
    : new Date().toISOString()

  const { error } = await supabase
    .from('transactions')
    .update({ description, icon, amount: parseFloat(amount), category, type, date: validDate, account_id })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── upsertBudget ─────────────────────────────────────────────────────────────

const upsertBudgetSchema = z.object({
  category: z.string().min(1),
  monthly_limit: z.string().min(1),
})

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>

export async function upsertBudget(
  input: UpsertBudgetInput
): Promise<{ success?: true; error?: string }> {
  const parsed = upsertBudgetSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { category, monthly_limit } = parsed.data
  const limit = parseFloat(monthly_limit)
  if (isNaN(limit) || limit <= 0) return { error: 'Invalid amount' }

  const { error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: user.id, category, monthly_limit: limit },
      { onConflict: 'user_id,category' }
    )

  if (error) return { error: error.message }
  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── deleteBudget ─────────────────────────────────────────────────────────────

export async function deleteBudget(
  id: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── deleteTransaction ────────────────────────────────────────────────────────

export async function deleteTransaction(
  id: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── createGoal ───────────────────────────────────────────────────────────────

const goalSchema = z.object({
  name: z.string().min(2),
  target_amount: z.string().min(1),
  deadline: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

export async function createGoal(
  input: z.infer<typeof goalSchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { name, target_amount, deadline, icon } = parsed.data

  const { error } = await supabase.from('savings_goals').insert({
    user_id: user.id,
    name,
    target_amount: parseFloat(target_amount),
    deadline: deadline || null,
    icon: icon || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── updateGoal ───────────────────────────────────────────────────────────────

export async function updateGoal(
  id: string,
  input: z.infer<typeof goalSchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { name, target_amount, deadline, icon } = parsed.data

  const { error } = await supabase
    .from('savings_goals')
    .update({
      name,
      target_amount: parseFloat(target_amount),
      deadline: deadline || null,
      icon: icon || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── deleteGoal ───────────────────────────────────────────────────────────────

export async function deleteGoal(
  id: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── fetchUserCategories ──────────────────────────────────────────────────────

import type { UserCategory } from './data'

const DEFAULT_CATEGORIES_SEED = [
  { name: 'food',      label: 'Alimentación', color: '#f97316', icon: 'Utensils' },
  { name: 'home',      label: 'Hogar',        color: '#3b82f6', icon: 'Home' },
  { name: 'transport', label: 'Transporte',   color: '#8b5cf6', icon: 'Car' },
  { name: 'health',    label: 'Salud',        color: '#ef4444', icon: 'Heart' },
  { name: 'leisure',   label: 'Ocio',         color: '#fbbf24', icon: 'Gamepad2' },
  { name: 'income',    label: 'Ingreso',      color: '#22c55e', icon: 'TrendingUp' },
]

export async function fetchUserCategories(): Promise<UserCategory[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, label, color, icon')
    .eq('user_id', user.id)
    .order('created_at')

  if (error) return []

  if (!data || data.length === 0) {
    await supabase.from('categories').upsert(
      DEFAULT_CATEGORIES_SEED.map(c => ({ ...c, user_id: user.id })),
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

// ─── createCategory ───────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
})

export async function createCategory(
  input: z.infer<typeof categorySchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    ...parsed.data,
  })

  if (error) return { error: error.message }
  revalidatePath('/categories')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── updateCategory ───────────────────────────────────────────────────────────

const updateCategorySchema = z.object({
  label: z.string().min(1),
  color: z.string().min(1),
  icon: z.string().min(1),
})

export async function updateCategory(
  id: string,
  input: z.infer<typeof updateCategorySchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = updateCategorySchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/categories')
  revalidatePath('/dashboard')
  revalidatePath('/budgets')
  return { success: true }
}

// ─── deleteCategory ───────────────────────────────────────────────────────────

export async function deleteCategory(
  id: string
): Promise<{ success?: true; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/categories')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── contributeToGoal ─────────────────────────────────────────────────────────

const contributeGoalSchema = z.object({
  amount: z.string().min(1),
  create_transaction: z.boolean(),
  account_id: z.string().optional().nullable(),
})

export async function contributeToGoal(
  id: string,
  input: z.infer<typeof contributeGoalSchema>
): Promise<{ success?: true; error?: string }> {
  const parsed = contributeGoalSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { amount, create_transaction, account_id } = parsed.data
  const contributionAmount = parseFloat(amount)
  if (isNaN(contributionAmount) || contributionAmount <= 0) return { error: 'Invalid amount' }

  // 1. Fetch current goal
  const { data: goal, error: fetchError } = await supabase
    .from('savings_goals')
    .select('id, name, current_amount, icon')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !goal) return { error: 'Goal not found' }

  // 2. Update goal
  const newAmount = parseFloat((goal.current_amount + contributionAmount).toFixed(2))
  const { error: updateError } = await supabase
    .from('savings_goals')
    .update({ current_amount: newAmount })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }

  // 3. Optionally create a transaction
  if (create_transaction && account_id) {
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id,
      description: `Contribution to goal: ${goal.name}`,
      icon: goal.icon || 'Target',
      amount: contributionAmount,
      category: 'other', // We use 'other' as generic
      type: 'expense',
      date: new Date().toISOString(),
    })
    
    if (txError) {
      console.error('Error creating transaction for goal contribution', txError)
      // we still return success because goal was updated
    }
  }

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}
