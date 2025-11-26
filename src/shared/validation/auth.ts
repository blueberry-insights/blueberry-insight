// shared/validation/auth.ts
import { z } from "zod";

// Validation plus permissive : au moins 8 caractères, au moins 1 lettre et 1 chiffre
// Accepte tous les caractères Unicode (pas seulement ASCII)
const passwordRules =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const EmailSchema = z
  .string()
  .min(1, "Email requis")
  .pipe(
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'email invalide")
  );
export const PasswordSchema = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(passwordRules, "Min. 8, au moins 1 lettre et 1 chiffre");

// — Login —
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

// — Register —
export const RegisterSchema = z
  .object({
    fullName: z.string().min(2, "Nom trop court").max(80, "Nom trop long"),
    orgName: z.string().min(2, "Organisation requise").max(80),
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

// — Reset (email-only) —
export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

// — Reset (nouveau mot de passe) —
export const UpdatePasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
