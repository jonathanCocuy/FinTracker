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
  if (!parsed.success) return { error: 'Datos inválidos' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
  if (!parsed.success) return { error: 'Datos inválidos' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
  if (!parsed.success) return { error: 'Datos inválidos' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
  if (!user) return { error: 'No autenticado' }

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
  if (!parsed.success) return { error: 'Datos inválidos' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
  if (!parsed.success) return { error: 'Datos inválidos' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { category, monthly_limit } = parsed.data
  const limit = parseFloat(monthly_limit)
  if (isNaN(limit) || limit <= 0) return { error: 'Monto inválido' }

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
  if (!user) return { error: 'No autenticado' }

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
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
