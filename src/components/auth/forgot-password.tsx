"use client"

import * as React from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { supabase } from "@/src/lib/supabase"
import { useI18n } from "@/src/lib/i18n"

import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"

export function ForgotPasswordModal() {
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)

  async function handleSendReset() {
    setIsLoading(true)
    
    // Obtenemos el usuario actual para saber a qué email enviar
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password?lang=${locale}`,
      })

      if (error) {
        alert(error.message)
      } else {
        setIsSent(true)
      }
    }
    
    setIsLoading(false)
  }

  return (
    <Dialog onOpenChange={(open) => !open && setTimeout(() => setIsSent(false), 200)}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto cursor-pointer">
          {t("auth.login.forgotPassword")}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[380px] rounded-2xl border-white/10 bg-zinc-950 p-6">
        {!isSent ? (
          <div className="space-y-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <AlertCircle className="text-primary" size={24} />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {t("forgotPassword.title")}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                {t("forgotPassword.description")}
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={handleSendReset}
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl font-bold py-6 cursor-pointer"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : t("forgotPassword.sendButton")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{t("forgotPassword.successTitle")}</h3>
              <p className="text-xs text-zinc-400">{t("forgotPassword.successDescription")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}