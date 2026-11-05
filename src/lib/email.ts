import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const from = () => process.env.RESEND_FROM_EMAIL ?? 'FlowX <onboarding@resend.dev>'

export async function sendGroupInviteEmail({
  toEmail,
  toName,
  inviterName,
  groupName,
}: {
  toEmail: string
  toName: string
  inviterName: string
  groupName: string
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping invite email')
    return
  }

  await resend.emails.send({
    from: from(),
    to: toEmail,
    subject: `${inviterName} te invitó al grupo "${groupName}" en FlowX`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Invitación a grupo compartido</h2>
        <p style="color:#555;margin:0 0 24px">
          Hola ${toName}, <strong>${inviterName}</strong> te invitó al grupo
          <strong>"${groupName}"</strong> en FlowX para gestionar gastos compartidos.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/shared"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Ver grupo
        </a>
        <p style="color:#999;font-size:12px;margin-top:32px">
          Si no esperabas esta invitación puedes ignorar este correo.
        </p>
      </div>
    `,
  })
}

export async function sendBudgetAlertEmail({
  toEmail,
  toName,
  categoryLabel,
  threshold,
  spentAmount,
  limitAmount,
  currency,
}: {
  toEmail: string
  toName: string
  categoryLabel: string
  threshold: 80 | 100
  spentAmount: number
  limitAmount: number
  currency: string
}) {
  const resend = getResend()
  if (!resend) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const isOver = threshold === 100
  const accentColor = isOver ? '#ef4444' : '#f59e0b'
  const emoji = isOver ? '🚨' : '⚠️'
  const pct = Math.round((spentAmount / limitAmount) * 100)

  const fmt = (n: number) =>
    new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-CO', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(n)

  await resend.emails.send({
    from: from(),
    to: toEmail,
    subject: `${emoji} ${isOver ? 'Límite superado' : 'Alerta de presupuesto'}: ${categoryLabel} al ${pct}%`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="display:inline-block;background:${accentColor}22;color:${accentColor};padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.05em;margin-bottom:16px">
          ${isOver ? 'PRESUPUESTO SUPERADO' : 'ALERTA 80%'}
        </div>
        <h2 style="margin:0 0 8px;font-size:20px">
          ${categoryLabel} — ${pct}% usado
        </h2>
        <p style="color:#555;margin:0 0 24px">
          Hola ${toName}, has ${isOver ? 'superado' : 'alcanzado el 80% de'} tu presupuesto mensual
          de <strong>${categoryLabel}</strong>.<br><br>
          Gastado: <strong>${fmt(spentAmount)}</strong> de <strong>${fmt(limitAmount)}</strong>
        </p>
        <a href="${appUrl}/budgets"
           style="display:inline-block;background:${accentColor};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Ver presupuestos
        </a>
        <p style="color:#999;font-size:12px;margin-top:32px">
          Puedes desactivar estas alertas en la configuración de tu perfil.
        </p>
      </div>
    `,
  })
}
