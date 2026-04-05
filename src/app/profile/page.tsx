"use client"

import { Navbar } from "@/src/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle,	CardFooter } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Separator } from "@/src/components/ui/separator"
import { Button } from "@/src/components/ui/button"
import { ChangePasswordModal } from "@/src/components/dashboard/forgot-password"
import { 
  User, 
  ShieldCheck, 
  Palette, 
  CreditCard,
  Crown
} from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />
      
      <main className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* --- HEADER DE IDENTIDAD --- */}
        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8 md:p-12 backdrop-blur-sm">
          <div className="absolute top-0 right-0 p-6">
             <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 px-3 py-1">
               <Crown size={14} /> Premium
             </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="h-28 w-28 border-4 border-background shadow-2xl">
              <AvatarImage src="" /> 
              <AvatarFallback className="bg-linear-to-br from-primary to-purple-600 text-3xl font-black text-black">
                JC
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col text-center md:text-left space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Jonathan Cocuy</h1>
              <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                Software Developer & Football Coach
              </p>
            </div>
          </div>
        </section>

        {/* --- GRID DE CONFIGURACIÓN --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Información Personal */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User size={18} className="text-primary" />
                  Información Personal
                </CardTitle>
                <CardDescription>Gestiona tus datos básicos de FinTracker.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" defaultValue="Jonathan Cocuy" className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="jonathan@dev.com" className="bg-background/50" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center items-end gap-2 flex-col">
                <Button variant="outline" className="w-full sm:w-auto border-border/40 hover:bg-accent/50 font-bold text-xs cursor-pointer">
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck size={18} className="text-primary" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
              {/* Sección de Cambio de Contraseña */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">Contraseña</p>
                  <p className="text-xs text-muted-foreground">Actualiza tu contraseña para mantener tu cuenta segura.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <ChangePasswordModal />
                  
                  <Button 
                    variant="link" 
                    className="text-xs text-muted-foreground hover:text-primary p-0 h-auto justify-start cursor-pointer" 
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </div>
            </CardContent>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-border/40">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Autenticación de dos pasos</p>
                    <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad.</p>
                  </div>
                  <Switch className="cursor-pointer"/>
                </div>
              </CardContent>
              
            </Card>
          </div>

          {/* Columna Derecha: Preferencias Rápidas */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette size={18} className="text-primary" />
                  Personalización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>Modo Oscuro</span>
                    <span className="text-xs font-normal text-muted-foreground">Forzar tema dark</span>
                  </Label>
                  <Switch className="cursor-pointer" defaultChecked/>
                </div>
                <Separator className="bg-border/40" />
                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>Notificaciones</span>
                    <span className="text-xs font-normal text-muted-foreground">Alertas de gastos</span>
                  </Label>
                  <Switch className="cursor-pointer" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard size={18} className="text-primary" />
                  Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Tu próximo pago es el **19 de Abril, 2026**.
                </p>
                <Button className="w-full bg-primary text-black font-bold hover:scale-[1.02] transition-transform cursor-pointer">
                  Gestionar Plan
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}