'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/src/lib/i18n";
import { supabase } from "@/src/lib/supabase";
import { PiggyBank, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/src/components/ui/card";
import { LanguageSwitcher } from "@/src/components/language-switcher";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setIsSent(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 h-screen w-full">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex items-center gap-2 font-bold text-2xl md:text-3xl tracking-tighter">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <PiggyBank className="h-6 w-6 text-black" fill="black" />
        </div>
        <span>FinTracker</span>
      </div>

      <Card className="w-full min-w-sm max-w-sm">
        {!isSent ? (
          <>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <AlertCircle className="text-primary" size={20} />
              </div>
              <CardTitle className="text-xl font-bold">{t("forgotPassword.title")}</CardTitle>
              <CardDescription>{t("forgotPassword.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email" className="text-sm cursor-pointer">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-red-500 text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {errorMessage}
                  </p>
                )}

                <Button type="submit" disabled={isLoading} size="lg" className="cursor-pointer">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("forgotPassword.sendButton")}
                </Button>

                <Button type="button" variant="ghost" size="lg" className="cursor-pointer" onClick={() => router.push("/login")}>
                  {t("common.back") ?? "Back to login"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-2">
                <CheckCircle2 className="text-emerald-500" size={26} />
              </div>
              <CardTitle className="text-xl font-bold">{t("forgotPassword.successTitle")}</CardTitle>
              <CardDescription>{t("forgotPassword.successDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="lg" className="w-full cursor-pointer" onClick={() => router.push("/login")}>
                {t("common.back") ?? "Back to login"}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
