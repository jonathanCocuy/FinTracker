"use client"

import * as React from "react"
import { useState } from "react"
import { supabase } from "@/src/lib/supabase"
import { Loader2, ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"

interface MfaEnrollmentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface MfaUnenrollModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  onSuccess: () => void
}

export function MfaEnrollmentModal({ isOpen, onOpenChange, onSuccess }: MfaEnrollmentModalProps) {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'success'>('initial')
  const [qrCode, setQrCode] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [factorId, setFactorId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEnrollment = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Limpieza preventiva para evitar error 422
      const { data: existing } = await supabase.auth.mfa.listFactors()
      if (existing?.all) {
        for (const f of existing.all) {
          if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (enrollError) throw enrollError
      
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setStep('qr')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyFactor = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: vError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      })
      if (vError) throw vError
      
      setStep('success')
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setStep('initial')
        setVerifyCode("")
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) setStep('initial')
    }}>
      <DialogContent className="max-w-[92vw] sm:max-w-[420px] rounded-[32px] bg-zinc-950 border-white/5 p-6 shadow-2xl outline-none">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          {step !== 'success' && (
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="text-primary" size={24} />
            </div>
          )}
          
          {step === 'initial' && (
            <>
              <DialogTitle className="text-xl font-black text-white">Seguridad de Dos Pasos</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Añade una capa extra de protección a tu cuenta de FinTracker usando una app de autenticación.
              </DialogDescription>
            </>
          )}

          {step === 'qr' && (
            <>
              <DialogTitle className="text-xl font-black text-white">Escanea el Código</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Usa Google Authenticator o Authy para escanear este código QR.
              </DialogDescription>
            </>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 animate-in zoom-in duration-500">
                <CheckCircle2 className="text-primary" size={40} />
              </div>
              <DialogTitle className="text-2xl font-black text-white">¡Configurado!</DialogTitle>
              <p className="text-zinc-500 text-sm">Tu cuenta ahora está protegida.</p>
            </div>
          )}
        </DialogHeader>

        {step === 'initial' && (
          <Button onClick={startEnrollment} disabled={isLoading} className="w-full mt-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold py-6">
            {isLoading ? <Loader2 className="animate-spin" /> : "Comenzar Configuración"}
          </Button>
        )}

        {step === 'qr' && (
          <div className="space-y-6 mt-4 flex flex-col items-center">
            <div className="p-4 bg-white rounded-[24px] shadow-inner">
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <Button onClick={() => setStep('verify')} className="w-full bg-primary text-black font-bold rounded-2xl py-6">
              Ya lo escaneé
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs px-1">Código de 6 dígitos</Label>
              <Input 
                placeholder="000 000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="bg-zinc-900 border-white/5 rounded-2xl h-12 text-center text-xl font-mono tracking-[0.5em] text-white"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>}
            <Button onClick={verifyFactor} disabled={isLoading || verifyCode.length < 6} className="w-full bg-white text-black font-bold rounded-2xl py-6">
              {isLoading ? <Loader2 className="animate-spin" /> : "Verificar y Activar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function MfaUnenrollModal({ isOpen, onOpenChange, userEmail, onSuccess }: MfaUnenrollModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnenroll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError) throw listError

      const factorsToRemove = (data?.all || []).filter((f) => f.status === "verified")
      if (factorsToRemove.length === 0) throw new Error("No verified MFA factors found.")

      for (const factor of factorsToRemove) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (unenrollError) throw unenrollError
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-[420px] rounded-[32px] bg-zinc-950 border-white/5 p-6 shadow-2xl outline-none">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-black text-white">Desactivar autenticacion en dos pasos</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Vas a desactivar MFA para {userEmail || "tu cuenta"}.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-500 text-[11px] mt-2">{error}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button className="rounded-2xl bg-white text-black hover:bg-zinc-200" onClick={handleUnenroll} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Desactivar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}