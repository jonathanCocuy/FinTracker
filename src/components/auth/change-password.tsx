"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { useI18n } from "@/src/lib/i18n"
import { supabase } from "@/src/lib/supabase"
import { cn } from "@/src/lib/utils"

interface PasswordFormValues {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordModal() {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showOld, setShowOld] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)


  const passwordSchema = React.useMemo(
    () =>
      z
        .object({
          oldPassword: z.string().min(1, t("changePassword.validation.oldPasswordRequired")),
          newPassword: z.string().min(8, t("changePassword.validation.newPasswordMinLength")),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("changePassword.validation.passwordsDontMatch"),
          path: ["confirmPassword"],
        }),
    [t]
  )

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: PasswordFormValues) {
    setIsLoading(true);
    
    try {
      // 1. Obtener el correo del usuario actual para la re-autenticación
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) throw new Error(t("changePassword.validation.sessionNotFound"));
  
      // 2. Re-autenticar: Intentamos un login con la contraseña antigua
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.oldPassword,
      });
  
      if (signInError) {
        // Si falla, es porque la contraseña antigua es incorrecta
        form.setError("oldPassword", { 
          type: "manual", 
          message: t("changePassword.validation.invalidOldPassword") || "La contraseña actual es incorrecta" 
        });
        setIsLoading(false);
        return;
      }
  
      // 3. Si llegamos aquí, la contraseña antigua es válida. 
      // Ahora actualizamos a la nueva.
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword
      });
  
      if (updateError) {
        alert(updateError.message);
        return;
      }
  
      // 4. Éxito total
      setOpen(false);
      form.reset();
      // Aquí puedes añadir un toast de éxito si lo tienes configurado
      console.log(t("changePassword.successLog"));
  
    } catch (error) {
      console.error("Error inesperado:", error);
      alert(t("changePassword.validation.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 cursor-pointer rounded-xl">
          <KeyRound size={16} />
          {t("changePassword.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-white/10 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">{t("changePassword.title")}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t("changePassword.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* Contraseña Antigua */}
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">
                    {t("changePassword.currentPasswordLabel")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showOld ? "text" : "password"} 
                        className={cn(
                          "bg-zinc-900 border-white/5 rounded-xl pr-10",
                          form.formState.errors.oldPassword && "border-red-500/50 focus-visible:ring-red-500/50"
                        )} 
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            <div className="h-px w-full bg-white/5 my-2" />

            {/* Nueva Contraseña */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">
                    {t("changePassword.newPasswordLabel")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showNew ? "text" : "password"} 
                        className={cn(
                          "bg-zinc-900 border-white/5 rounded-xl pr-10",
                          form.formState.errors.newPassword && "border-red-500/50"
                        )} 
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* Confirmar Nueva Contraseña */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">
                    {t("changePassword.confirmNewPasswordLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      className={cn(
                        "bg-zinc-900 border-white/5 rounded-xl",
                        form.formState.errors.confirmPassword && "border-red-500/50"
                      )} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl font-bold py-6 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  t("changePassword.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}