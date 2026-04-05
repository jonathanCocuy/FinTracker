"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"

// Esquema de validación con Zod
const passwordSchema = z.object({
  oldPassword: z.string().min(1, "La contraseña antigua es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export function ChangePasswordModal() {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showOld, setShowOld] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true)
    // Aquí iría tu lógica con Supabase:
    // const { error } = await supabase.rpc('change_user_password', { ... })
    
    console.log("Cambiando contraseña...", values)
    
    setTimeout(() => {
      setIsLoading(false)
      setOpen(false)
      form.reset()
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 cursor-pointer rounded-xl">
          <KeyRound size={16} />
          Cambiar contraseña
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-white/10 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Seguridad</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Actualiza tu contraseña para mantener tu cuenta de FinTracker segura.
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
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">Contraseña Actual</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showOld ? "text" : "password"} 
                        className="bg-zinc-900 border-white/5 rounded-xl pr-10" 
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
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="h-[1px] w-full bg-white/5 my-2" />

            {/* Nueva Contraseña */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showNew ? "text" : "password"} 
                        className="bg-zinc-900 border-white/5 rounded-xl pr-10" 
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
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Confirmar Nueva Contraseña */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] uppercase font-black tracking-widest opacity-50">Confirmar Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      className="bg-zinc-900 border-white/5 rounded-xl" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
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
                  "Actualizar Contraseña"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}