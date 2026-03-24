'use client';

import { useI18n } from "@/src/lib/i18n";
import { createLoginSchema, type LoginSchema } from "@/src/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/src/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const loginSchema = createLoginSchema(t)
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginSchema) => {
    console.log(`User ${data.email} logged in`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full min-w-sm max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("auth.login.title")}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-sm pb-1 cursor-pointer">{t("common.email")}</Label>
              <Input id="email" type="email" placeholder={t("auth.login.emailPlaceholder")} {...form.register("email")} className={cn(form.formState.errors.email?.message && "border-red-500")} />
              {form.formState.errors.email?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.email?.message}</p>}
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="password" className="text-md cursor-pointer">{t("common.password")}</Label>
                <Button type="button" variant="link" size="lg" onClick={() => router.push("/forgot-password")} className="text-sm p-0 m-0 cursor-pointer">{t("auth.login.forgotPassword")}</Button>
              </div>
              <Input id="password" type="password" placeholder={t("auth.login.passwordPlaceholder")} {...form.register("password")} className={cn(form.formState.errors.password?.message && "border-red-500")} />
              {form.formState.errors.password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.password?.message?.toString()}</p>}
            </div>
              <Button type="submit" variant="default" size="lg" className="cursor-pointer">{t("auth.login.submit")}</Button>
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