import { z } from "zod";

export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email({ message: t("validation.invalidEmail") }),
    password: z.string().min(8, { message: t("validation.passwordMinLength") }),
  });
}

export function createRegisterSchema(t: (key: string) => string) {
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

/** @deprecated Use createLoginSchema(t) with useI18n */
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

/** @deprecated Use createRegisterSchema(t) with useI18n */
export const registerSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  confirm_password: z.string().min(8, { message: "Confirm password must be at least 8 characters long" }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;