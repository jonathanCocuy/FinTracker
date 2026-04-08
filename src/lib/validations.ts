import { z } from "zod";

// --- LOGIN SCHEMA ---
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email({ message: t("validation.invalidEmail") }),
    password: z.string().min(8, { message: t("validation.passwordMinLength") }),
  });
}

// --- REGISTER SCHEMA ---
export function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      full_name: z.string().min(2, { message: t("validation.fullNameMinLength") }),
      email: z.string().email({ message: t("validation.invalidEmail") }),
      password: z.string().min(8, { message: t("validation.passwordMinLength") }),
      confirm_password: z.string().min(8, { message: t("validation.confirmPasswordMinLength") }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t("validation.passwordsDontMatch"),
      path: ["confirm_password"], // Esto hace que el error aparezca en el input de confirmar
    });
}

// --- TYPES ---
// Usamos "any" o un esquema base para inferir los tipos sin necesidad de pasar la función "t" aquí
export type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;