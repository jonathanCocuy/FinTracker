"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/src/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Separator } from "@/src/components/ui/separator"
import { ChangePasswordModal } from "@/src/components/auth/change-password"
import { User, ShieldCheck, Palette, Crown, Loader2 } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { ForgotPasswordModal } from "@/src/components/auth/forgot-password"
import { supabase } from "@/src/lib/supabase"
import { useProfile } from "@/src/hooks/useProfile"
// IMPORTACIÓN CORREGIDA: Cada uno viene de su respectivo archivo
import { MfaUnenrollModal } from "@/src/components/auth/mfa-enrollment-modal"
import dynamic from "next/dynamic"

// Importación dinámica para el de activación (enrollment)
const MfaEnrollComponent = dynamic(
  () => import('@/src/components/auth/mfa-enrollment-modal').then((mod) => mod.MfaEnrollmentModal),
  { ssr: false }
)

export default function ProfilePage() {
  const { t } = useI18n();
  const { profile, loading: profileLoading } = useProfile();

  const [hasMounted, setHasMounted] = useState(false);
  const [isMfaEnrollOpen, setIsMfaEnrollOpen] = useState(false);
  const [isMfaUnenrollOpen, setIsMfaUnenrollOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
    const checkMFAStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!error && data?.all) {
          const isEnabled = data.all.some(f => f.status === 'verified');
          setIs2FAEnabled(isEnabled);
        }
      } catch (err) {
        console.error("Error checking MFA status:", err);
      } finally {
        setIsStatusLoading(false);
      }
    };
    checkMFAStatus();
  }, []);

  const handleToggle2FA = (checked: boolean) => {
    if (checked) {
      setIsMfaEnrollOpen(true);
    } else {
      setIsMfaUnenrollOpen(true);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "JP";
  };

  if (!hasMounted || profileLoading || isStatusLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />

      {/* Modal de Activación */}
      <MfaEnrollComponent 
        isOpen={isMfaEnrollOpen} 
        onOpenChange={setIsMfaEnrollOpen}
        onSuccess={() => setIs2FAEnabled(true)}
      />

      {/* Modal de Desactivación */}
      <MfaUnenrollModal
        isOpen={isMfaUnenrollOpen}
        onOpenChange={setIsMfaUnenrollOpen}
        userEmail={profile?.email || ""}
        onSuccess={() => setIs2FAEnabled(false)}
      />
      
      <main className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-zinc-900/50 p-8 md:p-12 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-6">
             <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 px-3 py-1">
               <Crown size={14} /> {t("profile.badges.premium")}
             </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="h-28 w-28 border-4 border-zinc-950 shadow-2xl">
              <AvatarImage src={profile?.avatar_url || ""} /> 
              <AvatarFallback className="bg-linear-to-br from-primary to-purple-600 text-3xl font-black text-black">
                {getInitials(profile?.full_name || "")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col text-center md:text-left space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-white">{profile?.full_name}</h1>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-white/5 bg-zinc-900/30 rounded-[28px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white font-black">
                  <User size={18} className="text-primary" />
                  {t("profile.personalInfo.title")}
                </CardTitle>
                <CardDescription>{t("profile.personalInfo.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 px-1">{t("common.fullName")}</Label>
                    <Input defaultValue={profile?.full_name} className="bg-zinc-950 border-white/5 rounded-2xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 px-1">{t("common.email")}</Label>
                    <Input disabled defaultValue={profile?.email} className="bg-zinc-950/50 border-white/5 opacity-50 rounded-2xl h-12" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-900/30 rounded-[28px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white font-black">
                  <ShieldCheck size={18} className="text-primary" />
                  {t("profile.security.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <ChangePasswordModal />
                  <ForgotPasswordModal /> 
                </div>
                
                <Separator className="bg-white/5" />
                
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{t("profile.security.twoFactorTitle")}</p>
                    <p className="text-[11px] text-zinc-500">{t("profile.security.twoFactorDescription")}</p>
                  </div>
                  <Switch 
                    checked={is2FAEnabled}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/5 bg-zinc-900/30 rounded-[28px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white font-black">
                  <Palette size={18} className="text-primary" />
                  {t("profile.preferences.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">{t("profile.preferences.darkModeTitle")}</Label>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-white/5" />
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">{t("profile.preferences.notificationsTitle")}</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}