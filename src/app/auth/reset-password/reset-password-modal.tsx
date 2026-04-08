"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { supabase } from "@/src/lib/supabase"
import { useRouter } from "next/navigation"
import { useI18n } from "@/src/lib/i18n"

import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"

// 1. Props que recibe el componente desde la página
interface ResetPasswordModalProps {
  forcedLang?: string | null;
}

// 2. Esquema de Zod para el formulario
const createResetSchema = (t: any) => z
  .object({
    password: z.string().min(8, t("resetPassword.validation.passwordMinLength")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("resetPassword.validation.passwordsDontMatch"),
    path: ["confirmPassword"],
  });

// Tipo inferido de Zod para el formulario
type ResetFormData = z.infer<ReturnType<typeof createResetSchema>>;

export function ResetPasswordModal({ forcedLang }: ResetPasswordModalProps) {
  const { t } = useI18n()
  void forcedLang
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  // Memorizamos el esquema para que no se recree innecesariamente
  const resetSchema = React.useMemo(() => createResetSchema(t), [t]);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: ResetFormData) {
    setIsLoading(true)
    
    const { error } = await supabase.auth.updateUser({
      password: values.password
    })
  
    if (error) {
      alert(error.message)
      setIsLoading(false)
    } else {
      setIsSuccess(true)
      setIsLoading(false)

      const channel = new BroadcastChannel('fintracker_auth');
      channel.postMessage('password_updated_successfully');
      channel.close();
  
      setTimeout(() => {
        window.close();
        router.push("/profile"); 
      }, 1500)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-[400px] rounded-3xl border-white/10 bg-zinc-950 p-6 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {!isSuccess ? (
          <>
            <DialogHeader className="space-y-3 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="text-primary" size={24} />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">{t("resetPassword.title")}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t("resetPassword.description")}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">
                        {t("resetPassword.newPasswordLabel")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            className="bg-zinc-900 border-white/5 rounded-xl pr-10" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">
                        {t("resetPassword.confirmPasswordLabel")}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          className="bg-zinc-900 border-white/5 rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-red-500" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl font-bold py-6 mt-2 cursor-pointer transition-all active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : t("resetPassword.submit")}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="text-emerald-500" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{t("resetPassword.successTitle")}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t("resetPassword.successDescription")}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}