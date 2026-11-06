'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank, Loader2, Eye, EyeOff, Camera, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher } from "@/src/components/language-switcher";

import { useI18n } from "@/src/lib/i18n";
import { createRegisterSchema, type RegisterSchema } from "@/src/lib/validations";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/src/components/ui/card";
import Image from "next/image";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const registerSchema = createRegisterSchema(t)
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"uploading" | "creating" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    setErrorMessage(null);
    let avatarUrl = "";

    try {
      if (avatarFile) {
        setLoadingStep("uploading");
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      setLoadingStep("creating");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            avatar_url: avatarUrl,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // If Supabase returns a session, email confirmation is disabled — go straight in
      if (signUpData.session) {
        router.push('/onboarding');
        return;
      }

      setIsRegistered(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep(null);
    }
  };

  if (isRegistered) {
    return (
      <div className="relative flex flex-col items-center justify-center gap-8 h-screen w-full">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-2 text-2xl md:text-3xl tracking-tighter">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <PiggyBank className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-aeonik-bold">FlowX</span>
        </div>
        <Card className="w-full min-w-sm max-w-sm">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-2">
              <CheckCircle2 className="text-emerald-500" size={26} />
            </div>
            <CardTitle className="text-xl font-aeonik-bold">{t("auth.register.successTitle") || "Check your inbox"}</CardTitle>
            <CardDescription className="font-aeonik-light">{t("auth.register.successDescription") || "We sent a confirmation link to your email. Click it to activate your account."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="lg" className="w-full cursor-pointer" onClick={() => router.push("/login")}>
              {t("auth.login.submit") || "Back to login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 h-screen w-full">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex items-center gap-2 text-2xl md:text-3xl tracking-tighter">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <PiggyBank className="h-6 w-6 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-aeonik-bold">FlowX</span>
      </div>
      <Card className="w-full min-w-sm max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-aeonik-bold">{t("auth.register.title")}</CardTitle>
          <CardDescription className="text-sm font-aeonik-light text-muted-foreground">{t("auth.register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            {/* Full Name */}
            <div className="flex flex-col">
                <Label htmlFor="avatar-upload" className="cursor-pointer group relative flex items-center justify-center gap-2">
                  <div className="h-15 w-15 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
                    {previewUrl ? (
                      <Image src={previewUrl} alt={t("auth.register.avatarPreviewAlt")} className="h-full w-full object-cover" width={15} height={15} />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      setPreviewUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return file ? URL.createObjectURL(file) : null;
                      });
                    }}
                  />
               </Label>
               <span className="text-[10px] text-muted-foreground mt-2 text-center">{t("auth.register.avatarHint")}</span>
              <Label htmlFor="full_name" className="text-sm pb-1 cursor-pointer">{t("common.fullName")}</Label>
              {form.formState.errors.full_name?.message && <p className="text-sm text-red-500 pl-2 pb-1">{form.formState.errors.full_name?.message}</p>}
              <Input id="full_name" type="text" placeholder={t("auth.register.fullNamePlaceholder")} {...form.register("full_name")} className={cn(form.formState.errors.full_name?.message && "border-red-500")} />
            </div>
            
            {/* Email */}
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-sm pb-1 cursor-pointer">{t("common.email")}</Label>
              {form.formState.errors.email?.message && <p className="text-sm text-red-500 pl-2 pb-1">{form.formState.errors.email?.message}</p>}
              <Input id="email" type="email" placeholder={t("auth.register.emailPlaceholder")} {...form.register("email")} className={cn(form.formState.errors.email?.message && "border-red-500")} />
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="password" className="text-md cursor-pointer">{t("common.password")}</Label>
              </div>
              {form.formState.errors.password?.message && <p className="text-sm text-red-500 pl-2 pb-1">{form.formState.errors.password?.message?.toString()}</p>}
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder={t("auth.register.passwordPlaceholder")} {...form.register("password")} className={cn("pr-10", form.formState.errors.password?.message && "border-red-500")} />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="confirm_password" className="text-md cursor-pointer">{t("common.confirmPassword")}</Label>
              </div>
              {form.formState.errors.confirm_password?.message && <p className="text-sm text-red-500 pl-2 pb-1">{form.formState.errors.confirm_password?.message}</p>}
              <div className="relative">
                <Input id="confirm_password" type={showConfirmPassword ? "text" : "password"} placeholder={t("auth.register.passwordPlaceholder")} {...form.register("confirm_password")} className={cn("pr-10", form.formState.errors.confirm_password?.message && "border-red-500")} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {errorMessage}
              </p>
            )}

            <Button type="submit" variant="default" size="lg" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingStep === "uploading" ? (t("auth.register.uploadingAvatar") || "Uploading photo…") : (t("auth.register.creatingAccount") || "Creating account…")}
                </span>
              ) : t("auth.register.submit")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center items-center gap-2 flex-col">
          <p className="text-sm text-muted-foreground">{t("auth.register.hasAccount")}</p>
          <Button variant="default" size="lg" type="button" onClick={() => router.push("/login")} className="cursor-pointer">{t("auth.register.goToLogin")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}