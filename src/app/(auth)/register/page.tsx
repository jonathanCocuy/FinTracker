'use client';

import { RegisterSchema, registerSchema } from "@/src/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/src/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (data: RegisterSchema) => {
    console.log(`User ${data.full_name} registered`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Register to your account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Enter your full name, email and password to register to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Label htmlFor="full_name" className="text-sm pb-1 cursor-pointer">Full Name</Label>
              <Input id="full_name" type="text" placeholder="John Doe" {...form.register("full_name")} className={cn("text-lg", form.formState.errors.full_name?.message && "border-red-500")} />
              {form.formState.errors.full_name?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.full_name?.message}</p>}
            </div>
            <div className="flex flex-col">
              <Label htmlFor="email" className="text-sm pb-1 cursor-pointer">Email</Label>
              <Input id="email" type="email" placeholder="username@example.com" {...form.register("email")} className={cn("text-lg", form.formState.errors.email?.message && "border-red-500")} />
              {form.formState.errors.email?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.email?.message}</p>}
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="password" className="text-md cursor-pointer">Password</Label>
              </div>
              <Input id="password" type="password" placeholder="********" {...form.register("password")} className={cn("text-lg", form.formState.errors.password?.message && "border-red-500")} />
              {form.formState.errors.password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.password?.message?.toString()}</p>}
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between pb-1">
                <Label htmlFor="confirm_password" className="text-md cursor-pointer"> Confirm password</Label>
              </div>
              <Input id="confirm_password" type="password" placeholder="********" {...form.register("confirm_password")} className={cn("text-lg", form.formState.errors.confirm_password?.message && "border-red-500")} />
              {form.formState.errors.confirm_password?.message && <p className="text-sm text-red-500 pl-2 pt-1">{form.formState.errors.confirm_password?.message}</p>}
            </div>
              <Button type="submit" variant="default" size="lg" className="cursor-pointer">Register</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center items-center gap-2 flex-col">
          <p className="text-sm text-muted-foreground">Don&apos;t have an account?</p>
          <Button variant="default" size="lg" type="button" onClick={() => router.push("/login")} className="cursor-pointer">Login</Button>
        </CardFooter>
      </Card>
    </div>
  );
}