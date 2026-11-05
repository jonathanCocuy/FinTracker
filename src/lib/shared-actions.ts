'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from './supabase-server'
import { sendGroupInviteEmail } from './email'

// ─── Helpers ─────────────────────────────────────────────────────────────────

type MemberInput = {
  name: string
  share_pct: number
  is_me: boolean
  color: string
  invited_email?: string | null
}

async function resolveMemberUserIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  currentUserId: string,
  members: MemberInput[],
  groupId: string,
  groupName: string,
  inviterName: string,
) {
  const rows = await Promise.all(members.map(async (m) => {
    if (m.is_me) {
      return { ...m, group_id: groupId, member_user_id: currentUserId, invited_email: null }
    }
    if (m.invited_email) {
      const { data: uid } = await supabase.rpc('get_user_id_by_email', { p_email: m.invited_email })
      if (uid) {
        // User already exists: create in-app notification + send email
        await supabase.rpc('create_notification', {
          p_user_id: uid,
          p_type: 'group_invite',
          p_title: `Invitación a "${groupName}"`,
          p_body: `${inviterName} te agregó al grupo compartido "${groupName}".`,
          p_data: { group_id: groupId, group_name: groupName, inviter_name: inviterName },
        })
        sendGroupInviteEmail({
          toEmail: m.invited_email,
          toName: m.name,
          inviterName,
          groupName,
        }).catch(console.error)
        return { ...m, group_id: groupId, member_user_id: uid, invited_email: null }
      }
      return {
        ...m,
        group_id: groupId,
        member_user_id: null,
        invited_email: m.invited_email.toLowerCase(),
      }
    }
    return { ...m, group_id: groupId, member_user_id: null, invited_email: null }
  }))
  return rows
}

// ─── Email lookup ────────────────────────────────────────────────────────────

export async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase.rpc('get_user_id_by_email', { p_email: email.toLowerCase() })
  return !!data
}

// ─── Claim invitations ────────────────────────────────────────────────────────

export async function claimPendingInvitations(): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const userEmail = user.email?.toLowerCase()
  if (!userEmail) { await supabase.rpc('claim_pending_invitations'); return }

  // Capture pending invitations before claiming so we can notify the user
  const { data: pending } = await supabase
    .from('shared_members')
    .select('group_id')
    .eq('invited_email', userEmail)
    .is('member_user_id', null)

  await supabase.rpc('claim_pending_invitations')

  if (!pending || pending.length === 0) return

  const groupIds = pending.map(p => p.group_id)
  const { data: groups } = await supabase
    .from('shared_groups')
    .select('id, name, user_id')
    .in('id', groupIds)

  if (!groups || groups.length === 0) return

  const inviterIds = [...new Set(groups.map(g => g.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', inviterIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

  for (const group of groups) {
    const inviterName = profileMap[group.user_id] ?? 'Alguien'
    await supabase.rpc('create_notification', {
      p_user_id: user.id,
      p_type: 'group_invite',
      p_title: `Te uniste a "${group.name}"`,
      p_body: `${inviterName} te agregó al grupo compartido "${group.name}".`,
      p_data: { group_id: group.id, group_name: group.name, inviter_name: inviterName },
    })
  }
}

// ─── Groups ──────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  name: z.string().min(1),
  share_pct: z.number().min(1).max(100),
  is_me: z.boolean(),
  color: z.string().min(1),
  invited_email: z.string().email().optional().nullable(),
})

const groupSchema = z.object({
  name: z.string().min(1),
  members: z.array(memberSchema).min(2),
})

export async function createSharedGroup(
  input: z.infer<typeof groupSchema>
): Promise<{ id?: string; error?: string }> {
  const parsed = groupSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const totalPct = parsed.data.members.reduce((s, m) => s + m.share_pct, 0)
  if (Math.abs(totalPct - 100) > 0.01) return { error: 'shares_not_100' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const inviterName = profile?.full_name ?? 'Alguien'

  const { data: group, error: gErr } = await supabase
    .from('shared_groups')
    .insert({ user_id: user.id, name: parsed.data.name })
    .select('id')
    .single()

  if (gErr || !group) return { error: gErr?.message ?? 'Failed to create group' }

  const membersToInsert = await resolveMemberUserIds(supabase, user.id, parsed.data.members, group.id, parsed.data.name, inviterName)
  const { error: mErr } = await supabase.from('shared_members').insert(membersToInsert)
  if (mErr) return { error: mErr.message }

  revalidatePath('/shared')
  return { id: group.id }
}

export async function updateSharedGroup(
  id: string,
  input: z.infer<typeof groupSchema>
): Promise<{ error?: string }> {
  const parsed = groupSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const totalPct = parsed.data.members.reduce((s, m) => s + m.share_pct, 0)
  if (Math.abs(totalPct - 100) > 0.01) return { error: 'shares_not_100' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const inviterName = profile?.full_name ?? 'Alguien'

  const { error: gErr } = await supabase
    .from('shared_groups')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('user_id', user.id)
  if (gErr) return { error: gErr.message }

  await supabase.from('shared_members').delete().eq('group_id', id)
  const membersToInsert = await resolveMemberUserIds(supabase, user.id, parsed.data.members, id, parsed.data.name, inviterName)
  const { error: mErr } = await supabase.from('shared_members').insert(membersToInsert)
  if (mErr) return { error: mErr.message }

  revalidatePath('/shared')
  revalidatePath(`/shared/${id}`)
  return {}
}

export async function deleteSharedGroup(id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('shared_groups')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/shared')
  return {}
}

// ─── Expenses ────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  group_id: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
  paid_by_member_id: z.string().nullable(),
  account_id: z.string().nullable(),
  is_me_payer: z.boolean(),
  my_share_pct: z.number().min(0).max(100),
  is_recurring: z.boolean().default(false),
  notes: z.string().optional().nullable(),
})

export type SharedExpenseInput = z.infer<typeof expenseSchema>

async function createTxForMyShare(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  userId: string,
  input: z.infer<typeof expenseSchema>,
  amountNum: number
): Promise<string | null> {
  if (!input.is_me_payer || !input.account_id) return null
  const myShare = parseFloat((amountNum * input.my_share_pct / 100).toFixed(2))
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: input.account_id,
      description: `${input.description} · Grupo`,
      icon: 'Users',
      amount: myShare,
      category: input.category,
      type: 'expense',
      date: new Date(input.date + 'T12:00:00').toISOString(),
      group_id: input.group_id,
    })
    .select('id')
    .single()
  if (error) return null
  return tx.id
}

export async function createSharedExpense(input: SharedExpenseInput): Promise<{ error?: string }> {
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amountNum = parseFloat(parsed.data.amount)
  if (isNaN(amountNum) || amountNum <= 0) return { error: 'Invalid amount' }

  const transaction_id = await createTxForMyShare(supabase, user.id, parsed.data, amountNum)

  const { error } = await supabase.from('shared_expenses').insert({
    group_id: parsed.data.group_id,
    description: parsed.data.description,
    amount: amountNum,
    category: parsed.data.category,
    date: parsed.data.date,
    paid_by_member_id: parsed.data.paid_by_member_id,
    account_id: parsed.data.is_me_payer ? parsed.data.account_id : null,
    transaction_id,
    is_recurring: parsed.data.is_recurring,
    notes: parsed.data.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/shared/${parsed.data.group_id}`)
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return {}
}

export async function updateSharedExpense(id: string, input: SharedExpenseInput): Promise<{ error?: string }> {
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amountNum = parseFloat(parsed.data.amount)
  if (isNaN(amountNum) || amountNum <= 0) return { error: 'Invalid amount' }

  const { data: existing } = await supabase
    .from('shared_expenses')
    .select('transaction_id')
    .eq('id', id)
    .single()

  if (existing?.transaction_id) {
    await supabase.from('transactions').delete().eq('id', existing.transaction_id)
  }

  const transaction_id = await createTxForMyShare(supabase, user.id, parsed.data, amountNum)

  const { error } = await supabase
    .from('shared_expenses')
    .update({
      description: parsed.data.description,
      amount: amountNum,
      category: parsed.data.category,
      date: parsed.data.date,
      paid_by_member_id: parsed.data.paid_by_member_id,
      account_id: parsed.data.is_me_payer ? parsed.data.account_id : null,
      transaction_id,
      is_recurring: parsed.data.is_recurring,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/shared/${parsed.data.group_id}`)
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return {}
}

export async function deleteSharedExpense(id: string, group_id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: expense } = await supabase
    .from('shared_expenses')
    .select('transaction_id')
    .eq('id', id)
    .single()

  if (expense?.transaction_id) {
    await supabase.from('transactions').delete().eq('id', expense.transaction_id)
  }

  const { error } = await supabase.from('shared_expenses').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/shared/${group_id}`)
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return {}
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

const budgetSchema = z.object({
  group_id: z.string().min(1),
  name: z.string().min(1),
  total_amount: z.string().min(1),
  month: z.string().min(1),
})

export async function createSharedBudget(input: z.infer<typeof budgetSchema>): Promise<{ error?: string }> {
  const parsed = budgetSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('shared_budgets').insert({
    group_id: parsed.data.group_id,
    name: parsed.data.name,
    total_amount: parseFloat(parsed.data.total_amount),
    month: parsed.data.month + '-01',
  })
  if (error) return { error: error.message }

  revalidatePath(`/shared/${parsed.data.group_id}`)
  return {}
}

export async function deleteSharedBudget(id: string, group_id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('shared_budgets').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/shared/${group_id}`)
  return {}
}

const entrySchema = z.object({
  budget_id: z.string().min(1),
  group_id: z.string().min(1),
  store_name: z.string().min(1),
  amount_spent: z.string().min(1),
  date: z.string().min(1),
})

export async function addSharedBudgetEntry(input: z.infer<typeof entrySchema>): Promise<{ error?: string }> {
  const parsed = entrySchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('shared_budget_entries').insert({
    budget_id: parsed.data.budget_id,
    store_name: parsed.data.store_name,
    amount_spent: parseFloat(parsed.data.amount_spent),
    date: parsed.data.date,
  })
  if (error) return { error: error.message }

  revalidatePath(`/shared/${parsed.data.group_id}`)
  return {}
}

export async function deleteSharedBudgetEntry(id: string, group_id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('shared_budget_entries').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/shared/${group_id}`)
  return {}
}

// ─── Settlement ───────────────────────────────────────────────────────────────

const settleSchema = z.object({
  group_id: z.string().min(1),
  amount: z.string().min(1),
  account_id: z.string().min(1),
  is_income: z.boolean(),
  description: z.string().min(1),
})

export async function settleSharedBalance(input: z.infer<typeof settleSchema>): Promise<{ error?: string }> {
  const parsed = settleSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid data' }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const amountNum = parseFloat(parsed.data.amount)
  if (isNaN(amountNum) || amountNum <= 0) return { error: 'Invalid amount' }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: parsed.data.account_id,
    description: parsed.data.description,
    icon: 'HandCoins',
    amount: amountNum,
    category: 'other',
    type: parsed.data.is_income ? 'income' : 'expense',
    date: new Date().toISOString(),
    group_id: parsed.data.group_id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return {}
}
