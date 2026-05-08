// Supabase Edge Function — generate-recurring
// Runs on a daily CRON schedule. Checks every active recurring_template and
// inserts a transaction into `transactions` when one is due today.
// Deploy: supabase functions deploy generate-recurring
// Secret: supabase secrets set CRON_SECRET=<your_random_secret>

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET        = Deno.env.get('CRON_SECRET') ?? ''

interface RecurringTemplate {
  id: string
  user_id: string
  account_id: string
  description: string
  icon: string
  amount: number
  category: string
  type: 'income' | 'expense'
  interval: 'monthly' | 'weekly'
  day_of_month: number | null
  day_of_week: number | null
  last_generated_date: string | null
}

Deno.serve(async (req: Request) => {
  // ── Security: reject calls without the correct secret ─────────────────────
  const incomingSecret = req.headers.get('x-cron-secret') ?? ''
  if (CRON_SECRET && incomingSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

    // ── Today's reference values ──────────────────────────────────────────────
    const today      = new Date()
    const todayStr   = today.toISOString().split('T')[0]   // YYYY-MM-DD
    const todayDay   = today.getDate()                      // 1-31
    const todayWday  = today.getDay()                       // 0=Sun … 6=Sat
    const todayYYMM  = todayStr.substring(0, 7)             // YYYY-MM

    // ── Fetch all active templates (service role bypasses RLS) ────────────────
    const { data: templates, error: fetchErr } = await supabase
      .from('recurring_templates')
      .select('id, user_id, account_id, description, icon, amount, category, type, interval, day_of_month, day_of_week, last_generated_date')
      .eq('is_active', true)

    if (fetchErr) throw fetchErr

    if (!templates?.length) {
      return json({ generated: 0, message: 'No active templates' })
    }

    const txToInsert: Record<string, unknown>[] = []
    const idsToUpdate: string[] = []

    for (const t of templates as RecurringTemplate[]) {
      if (!isDue(t, todayDay, todayWday, todayYYMM, todayStr)) continue

      txToInsert.push({
        user_id:     t.user_id,
        account_id:  t.account_id,
        description: t.description,
        icon:        t.icon,
        amount:      t.amount,
        category:    t.category,
        type:        t.type,
        date:        todayStr + 'T00:00:00.000Z',
      })
      idsToUpdate.push(t.id)
    }

    if (!txToInsert.length) {
      return json({ generated: 0, message: 'No templates due today' })
    }

    const { error: insertErr } = await supabase.from('transactions').insert(txToInsert)
    if (insertErr) throw insertErr

    const { error: updateErr } = await supabase
      .from('recurring_templates')
      .update({ last_generated_date: todayStr })
      .in('id', idsToUpdate)
    if (updateErr) throw updateErr

    return json({ generated: txToInsert.length, ids: idsToUpdate })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-recurring] Error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function isDue(
  t: RecurringTemplate,
  todayDay: number,
  todayWday: number,
  todayYYMM: string,
  todayStr: string,
): boolean {
  if (t.interval === 'monthly') {
    if (t.day_of_month === null) return false

    // Clamp to last day of current month (e.g. day 31 in Feb → Feb 28)
    const [year, month] = todayYYMM.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    const effectiveDay = Math.min(t.day_of_month, lastDay)

    if (todayDay !== effectiveDay) return false

    // Already generated this calendar month?
    if (t.last_generated_date?.substring(0, 7) === todayYYMM) return false

    return true
  }

  if (t.interval === 'weekly') {
    if (t.day_of_week === null) return false
    if (todayWday !== t.day_of_week) return false

    // Already generated within the last 7 days?
    if (t.last_generated_date) {
      const lastMs  = new Date(t.last_generated_date + 'T00:00:00Z').getTime()
      const todayMs = new Date(todayStr + 'T00:00:00Z').getTime()
      if (todayMs - lastMs < 7 * 24 * 60 * 60 * 1000) return false
    }
    return true
  }

  return false
}
