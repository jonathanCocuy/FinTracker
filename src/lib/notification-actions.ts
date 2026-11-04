'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from './supabase-server'

export type Notification = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, string>
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as Notification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await createSupabaseServer()
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
  revalidatePath('/', 'layout')
}
