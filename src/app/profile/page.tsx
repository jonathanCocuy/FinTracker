"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/src/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Separator } from "@/src/components/ui/separator"
import { ChangePasswordModal } from "@/src/components/auth/change-password"
import { User, ShieldCheck, Crown, Loader2, Camera, Bell } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { ForgotPasswordModal } from "@/src/components/auth/forgot-password"
import { supabase } from "@/src/lib/supabase"
import { useProfile } from "@/src/hooks/useProfile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { SUPPORTED_CURRENCIES, getFlagUrl } from "@/src/lib/currency"
// IMPORTACIÓN CORREGIDA: Cada uno viene de su respectivo archivo
import { MfaUnenrollModal } from "@/src/components/auth/mfa-enrollment-modal"
import dynamic from "next/dynamic"
import Image from 'next/image'

// Importación dinámica para el de activación (enrollment)
const MfaEnrollComponent = dynamic(
  () => import('@/src/components/auth/mfa-enrollment-modal').then((mod) => mod.MfaEnrollmentModal),
  { ssr: false }
)

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { profile, loading: profileLoading } = useProfile();

  const [hasMounted, setHasMounted] = useState(false);
  const [isMfaEnrollOpen, setIsMfaEnrollOpen] = useState(false);
  const [isMfaUnenrollOpen, setIsMfaUnenrollOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emailNotificationsOverride, setEmailNotificationsOverride] = useState<boolean | null>(null);
  const emailNotifications = emailNotificationsOverride !== null ? emailNotificationsOverride : (profile?.email_notifications ?? true);
  const [baseCurrencyOverride, setBaseCurrencyOverride] = useState<string | null>(null);
  const baseCurrency = baseCurrencyOverride !== null ? baseCurrencyOverride : (profile?.base_currency ?? 'COP');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    };
    checkMFAStatus();
  }, []);

  const handleToggleEmailNotifications = async (checked: boolean) => {
    setEmailNotificationsOverride(checked);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ email_notifications: checked }).eq('id', user.id);
  };

  const handleBaseCurrencyChange = async (currency: string) => {
    setBaseCurrencyOverride(currency);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ base_currency: currency }).eq('id', user.id);
  };

  const handleToggle2FA = (checked: boolean) => {
    if (checked) {
      setIsMfaEnrollOpen(true);
    } else {
      setIsMfaUnenrollOpen(true);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('profiles').update({ avatar_url: urlWithBust }).eq('id', user.id);

      setAvatarUrl(urlWithBust);
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "JP";
  };

  if (!hasMounted || profileLoading) {
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
          {/* Decorative background glows */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#6366f1]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 right-1/4 w-56 h-56 rounded-full bg-[#a78bfa]/8 blur-3xl pointer-events-none" />

          <div className="absolute top-0 right-0 p-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 px-3 py-1">
              <Crown size={14} /> {t("profile.badges.premium")}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
            {/* Avatar with gradient ring */}
            <div className="relative group shrink-0">
              <div className="p-[3px] rounded-full bg-linear-to-br from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] shadow-2xl shadow-[#6366f1]/30">
                <button
                  type="button"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="relative block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label={t("profile.personalInfo.changePhoto")}
                >
                  <Avatar className="h-28 w-28 border-2 border-zinc-900">
                    <AvatarImage src={avatarUrl ?? profile?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-linear-to-br from-[#6366f1] to-[#a78bfa] text-3xl font-black text-white">
                      {getInitials(profile?.full_name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <>
                        <Camera size={18} className="text-white" />
                        <span className="text-[10px] font-semibold text-white leading-none">
                          {t("profile.personalInfo.changePhoto")}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name & info */}
            <div className="flex flex-col text-center md:text-left gap-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {profile?.email}
              </p>
              <h1 className="text-4xl font-black leading-none tracking-tight bg-linear-to-r from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent mt-1">
                {profile?.full_name}
              </h1>
              {profile?.created_at && (
                <p className="text-sm text-zinc-500 mt-2">
                  {t("profile.memberSince")}{" "}
                  {new Date(profile.created_at).toLocaleDateString(
                    locale === "en" ? "en-US" : "es-CO",
                    { month: "long", year: "numeric" }
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 px-1">{t("currency.baseCurrency")}</Label>
                  <Select value={baseCurrency} onValueChange={handleBaseCurrencyChange}>
                    <SelectTrigger className="bg-zinc-950 border-white/5 rounded-2xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => (
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center gap-2">
                            <Image src={getFlagUrl(c)} alt={c} className="w-5 h-auto rounded-sm shrink-0" width={50} height={50}/>
                            {c} — {t(`currency.${c}`)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Switch checked={is2FAEnabled} onCheckedChange={handleToggle2FA} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-900/30 rounded-[28px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white font-black">
                  <Bell size={18} className="text-primary" />
                  {t("profile.notifications.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{t("profile.notifications.emailAlertsTitle")}</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={handleToggleEmailNotifications} />
                </div>
                <div className="px-1 space-y-2">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">{t("profile.notifications.triggersTitle")}</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[12px] text-zinc-400">{t("profile.notifications.trigger80")}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-[12px] text-zinc-400">{t("profile.notifications.trigger100")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* <div className="space-y-6">
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
          </div> */}
        </div>
      </main>
    </div>
  )
} 