import { z } from "zod";

export function LoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email({ message: t("validation.invalidEmail") }),
    password: z.string().min(8, { message: t("validation.passwordMinLength") }),
  });
}

export function RegisterSchema(t: (key: string) => string) {
  return z.object({
    full_name: z.string().min(2, { message: t("validation.fullNameMinLength") }),
    email: z.string().email({ message: t("validation.invalidEmail") }),
    password: z.string().min(8, { message: t("validation.passwordMinLength") }),
    confirm_password: z.string().min(8, { message: t("validation.confirmPasswordMinLength") }),
  }).refine((data) => data.password === data.confirm_password, {
    message: t("validation.passwordsDontMatch"),
    path: ["confirm_password"],
  });
}

export type LoginSchema = z.infer<ReturnType<typeof LoginSchema>>;
export type RegisterSchema = z.infer<ReturnType<typeof RegisterSchema>>;