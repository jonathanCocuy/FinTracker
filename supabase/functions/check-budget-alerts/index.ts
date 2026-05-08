// Supabase Edge Function — check-budget-alerts
// Runs on a daily CRON schedule. Checks every user's budget usage and sends
// an email notification via Resend when 80% or 100% threshold is first crossed.
// Deploy: supabase functions deploy check-budget-alerts
// Secrets: supabase secrets set RESEND_API_KEY=<key> CRON_SECRET=<secret> FROM_EMAIL=alerts@yourdomain.com

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET      = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') ?? 'FinTracker <noreply@fintracker.app>'

interface Profile {
  id: string
  full_name: string | null
  email_notifications: boolean
}

interface Budget {
  id: string
  category: string
  monthly_limit: number
}

Deno.serve(async (req: Request) => {
  const incomingSecret = req.headers.get('x-cron-secret') ?? ''
  if (CRON_SECRET && incomingSecret !== CRON_SECRET) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

    const now        = new Date()
    const year       = now.getUTCFullYear()
    const month      = now.getUTCMonth()
    const currentMon = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthStart = `${currentMon}-01`
    // Last day of current month
    const monthEnd   = new Date(Date.UTC(year, month + 1, 0)).toISOString().split('T')[0]

    // ── 1. Fetch all users with email notifications enabled ──────────────────
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email_notifications')
      .eq('email_notifications', true)

    if (profErr) throw profErr
    if (!profiles?.length) return json({ sent: 0, message: 'No users with notifications enabled' })

    let sent = 0

    for (const profile of profiles as Profile[]) {
      // ── 2. Get user email from Auth ────────────────────────────────────────
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(profile.id)
      if (userErr || !user?.email) continue

      // ── 3. Fetch user's budgets ────────────────────────────────────────────
      const { data: budgets } = await supabase
        .from('budgets')
        .select('id, category, monthly_limit')
        .eq('user_id', profile.id)

      if (!budgets?.length) continue

      // ── 4. Compute current month spending per category ────────────────────
      const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', profile.id)
        .eq('type', 'expense')
        .gte('date', monthStart)
        .lte('date', monthEnd)

      const spendingByCategory: Record<string, number> = {}
      for (const tx of transactions ?? []) {
        spendingByCategory[tx.category] = (spendingByCategory[tx.category] ?? 0) + tx.amount
      }

      // ── 5. Check each budget ───────────────────────────────────────────────
      for (const budget of budgets as Budget[]) {
        const spent      = spendingByCategory[budget.category] ?? 0
        const pct        = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0
        const threshold  = pct >= 100 ? 100 : pct >= 80 ? 80 : null

        if (threshold === null) continue

        // ── 6. Skip if already notified at this threshold this month ─────────
        const { data: existing } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', profile.id)
          .eq('budget_id', budget.id)
          .eq('threshold', threshold)
          .eq('month', currentMon)
          .maybeSingle()

        if (existing) continue

        // ── 7. Send email ────────────────────────────────────────────────────
        const firstName = profile.full_name?.split(' ')[0] ?? 'Usuario'
        const html = buildAlertEmail({
          firstName,
          category: budget.category,
          spent,
          limit: budget.monthly_limit,
          percentage: Math.round(pct),
          isOver: threshold === 100,
        })

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: threshold === 100
              ? `⚠️ Superaste tu presupuesto en ${budget.category}`
              : `Alerta: llevas el 80% de tu presupuesto en ${budget.category}`,
            html,
          }),
        })

        if (!resendRes.ok) {
          console.error(`[check-budget-alerts] Resend error for ${user.email}:`, await resendRes.text())
          continue
        }

        // ── 8. Log notification to prevent duplicates ────────────────────────
        await supabase.from('notification_logs').insert({
          user_id:   profile.id,
          budget_id: budget.id,
          threshold,
          month:     currentMon,
        })

        sent++
      }
    }

    return json({ sent, month: currentMon })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[check-budget-alerts] Fatal error:', message)
    return json({ error: message }, 500)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function buildAlertEmail(opts: {
  firstName: string
  category: string
  spent: number
  limit: number
  percentage: number
  isOver: boolean
}) {
  const { firstName, category, spent, limit, percentage, isOver } = opts
  const barColor   = isOver ? '#ef4444' : '#f97316'
  const barWidth   = Math.min(percentage, 100)
  const accentText = isOver
    ? `Has <strong>superado</strong> tu presupuesto mensual en <strong>${category}</strong>.`
    : `Llevas el <strong>${percentage}%</strong> de tu presupuesto en <strong>${category}</strong>.`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Presupuesto — FinTracker</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:28px 40px;text-align:center;">
              <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">FinTracker</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#1d1d1f;letter-spacing:-0.3px;">
                Hola, ${firstName} 👋
              </p>

              <!-- Message -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3d3f;">
                ${accentText} Te avisamos para que puedas gestionar tus gastos a tiempo.
              </p>

              <!-- Budget card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;border-radius:16px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#86868b;text-transform:uppercase;letter-spacing:0.08em;">Categoría</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1d1d1f;">${category}</p>

                    <!-- Progress bar -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="background:#e5e5ea;border-radius:99px;height:8px;overflow:hidden;">
                          <div style="width:${barWidth}%;background:${barColor};height:8px;border-radius:99px;"></div>
                        </td>
                      </tr>
                    </table>

                    <!-- Amounts row -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#86868b;">
                          <strong style="color:#1d1d1f;">${fmtCurrency(spent)}</strong> gastados
                        </td>
                        <td align="right" style="font-size:13px;color:#86868b;">
                          Límite: <strong style="color:#1d1d1f;">${fmtCurrency(limit)}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fintracker.app/budgets"
                       style="display:inline-block;padding:14px 32px;background:#000000;color:#ffffff;font-size:14px;font-weight:600;border-radius:999px;text-decoration:none;letter-spacing:-0.1px;">
                      Ver mis presupuestos
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:11px;color:#aeaeb2;text-align:center;line-height:1.6;">
                Recibiste este correo porque tienes activadas las alertas de presupuesto en FinTracker.<br>
                Puedes desactivarlas en <a href="https://fintracker.app/profile" style="color:#aeaeb2;">Configuración de perfil</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
