import { Resend } from 'resend'

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
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping invite email')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'FlowX <onboarding@resend.dev>',
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
