"use client"

import { useState } from "react"
import { supabase } from "@/src/lib/supabase"
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useRouter } from "next/navigation"
import { useI18n } from "@/src/lib/i18n"

export function MfaVerification() {
  const { t } = useI18n()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Buscamos el factor TOTP verificado del usuario
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError

      const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified')
      if (!totpFactor) throw new Error(t("mfa.verify.errors.noActiveFactor"))

      // 2. Desafiamos y verificamos el código de 6 dígitos
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: code
      })

      if (verifyError) throw verifyError

      // 3. Éxito: Redirigimos al dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || t("mfa.verify.errors.invalidCode"))
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-8 bg-card border border-border/50 rounded-[32px] backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <ShieldCheck className="text-primary" size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-foreground tracking-tight">{t("mfa.verify.title")}</h2>
          <p className="text-muted-foreground text-xs">{t("mfa.verify.description")}</p>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest px-1">{t("mfa.verify.codeLabel")}</Label>
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="bg-background border-border/50 rounded-2xl h-14 text-center text-2xl font-mono tracking-[0.3em] text-foreground focus:border-primary/50 transition-all"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || code.length < 6}
          className="w-full rounded-2xl font-bold py-6 transition-all"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : t("mfa.verify.submit")}
        </Button>
      </form>
      
      <button 
        onClick={() => router.push("/login")}
        className="flex items-center justify-center gap-2 w-full text-muted-foreground text-xs hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        {t("mfa.verify.backToLogin")}
      </button>
    </div>
  )
}