"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ResetPasswordModal } from "@/src/app/auth/reset-password/reset-password-modal"

// 1. Extraemos la lógica que usa searchParams a un subcomponente
function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const lang = searchParams.get('lang') || 'es'

  return <ResetPasswordModal forcedLang={lang} />
}

// 2. La página principal envuelve el contenido en Suspense
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Suspense fallback={<div className="text-white">Cargando...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}