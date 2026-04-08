'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank, Loader2 } from "lucide-react";

import { useI18n } from "@/src/lib/i18n";
import { createRegisterSchema, type RegisterSchema } from "@/src/lib/validations";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/src/components/ui/card";
import { Camera } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const registerSchema = createRegisterSchema(t)
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
  
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);
  
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

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
    let avatarUrl = "";

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            avatar_url: avatarUrl, // La función SQL que arreglamos ya sabe leer esto
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      router.push("/onboarding");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-screen">
      <div className="flex items-center gap-2 font-bold text-2xl md:text-3xl tracking-tighter">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <PiggyBank className="h-6 w-6 text-black" fill="black" />
        </div>
        <span>FinTracker</span>
      </div>
      <Card className="w-full min-w-sm max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("auth.register.title")}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{t("auth.register.subtitle")}</CardDescription>
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
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} 
                  />
               </Label>
               <span className="text-[10px] text-muted-foreground mt-2 text-center">{t("auth.register.avatarHint")}</span>
              <Label htmlFor="full_name" className="text-sm pb-1 cursor-pointer">{t("common.fullName")}</Label>
              <Input id="full_name" type="text" placeholder={t("auth.register.fullNamePlaceholder")} {...form.register("full_name")} className={cn(form.formState.errors.full_name?.message && "border-red-500")} />
              {form.formState.errors.full_name?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.full_name?.message}</p>}
            </div>
            
            {/* Email */}
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-sm pb-1 cursor-pointer">{t("common.email")}</Label>
              <Input id="email" type="email" placeholder={t("auth.register.emailPlaceholder")} {...form.register("email")} className={cn(form.formState.errors.email?.message && "border-red-500")} />
              {form.formState.errors.email?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.email?.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="password" className="text-md cursor-pointer">{t("common.password")}</Label>
              </div>
              <Input id="password" type="password" placeholder={t("auth.register.passwordPlaceholder")} {...form.register("password")} className={cn(form.formState.errors.password?.message && "border-red-500")} />
              {form.formState.errors.password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.password?.message?.toString()}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="confirm_password" className="text-md cursor-pointer">{t("common.confirmPassword")}</Label>
              </div>
              <Input id="confirm_password" type="password" placeholder={t("auth.register.passwordPlaceholder")} {...form.register("confirm_password")} className={cn(form.formState.errors.confirm_password?.message && "border-red-500")} />
              {form.formState.errors.confirm_password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.confirm_password?.message}</p>}
            </div>

            <Button type="submit" variant="default" size="lg" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.register.submit")}
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