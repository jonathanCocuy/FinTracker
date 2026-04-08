'use client';

import { useState } from "react"; // Añadimos useState para el flujo de MFA
import { useI18n } from "@/src/lib/i18n";
import { createLoginSchema, LoginSchema } from "@/src/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";  
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/src/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";
import { PiggyBank, Loader2 } from "lucide-react"; // Añadimos Loader2 para feedback
import { supabase } from "@/src/lib/supabase";
import { MfaVerification } from "@/src/components/auth/mfa-verification"; // Importamos el nuevo componente

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  // Estados nuevos para manejar el flujo
  const [showMfa, setShowMfa] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginSchema = createLoginSchema(t);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    // Verificamos si se requiere MFA (AAL2)
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (mfaError) {
      setErrorMessage(mfaError.message);
      setIsLoading(false);
      return;
    }

    // Si el usuario tiene MFA activado y aún no ha verificado el segundo factor
    if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
      setShowMfa(true);
      setIsLoading(false);
    } else {
      // Si no tiene MFA, entra normal
      router.push("/dashboard");
      router.refresh();
    }
  };

  // Si el login fue exitoso pero requiere código, mostramos la vista de verificación
  if (showMfa) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black p-4">
        <MfaVerification />
      </div>
    );
  }

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
          <CardTitle className="text-xl font-bold">{t("auth.login.title")}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-sm pb-1 cursor-pointer">{t("common.email")}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={t("auth.login.emailPlaceholder")} 
                {...form.register("email")} 
                className={cn(form.formState.errors.email?.message && "border-red-500")} 
              />
              {form.formState.errors.email?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.email?.message}</p>}
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="password" className="text-md cursor-pointer">{t("common.password")}</Label>
                <Button type="button" variant="link" size="lg" onClick={() => router.push("/forgot-password")} className="text-sm p-0 m-0 cursor-pointer">{t("auth.login.forgotPassword")}</Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder={t("auth.login.passwordPlaceholder")} 
                {...form.register("password")} 
                className={cn(form.formState.errors.password?.message && "border-red-500")} 
              />
              {form.formState.errors.password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.password?.message?.toString()}</p>}
            </div>

            {/* Mostramos el error de Supabase si existe */}
            {errorMessage && (
              <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {errorMessage}
              </p>
            )}

            <Button type="submit" variant="default" size="lg" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : t("auth.login.submit")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center items-center gap-2 flex-col">
          <p className="text-sm text-muted-foreground">{t("auth.login.noAccount")}</p>
          <Button variant="default" size="lg" type="button" onClick={() => router.push("/register")} className="cursor-pointer">{t("auth.login.goToRegister")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}