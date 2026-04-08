"use client"

import { useSearchParams } from "next/navigation"
import { ResetPasswordModal } from "@/src/app/auth/reset-password/reset-password-modal"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const lang = searchParams.get('lang') || 'es' // Por defecto español si no hay nada

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Pasamos el idioma al modal */}
      <ResetPasswordModal forcedLang={lang} />
    </div>
  )
}