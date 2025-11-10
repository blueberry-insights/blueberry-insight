import { z } from "zod";

const passwordRules =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

export const LoginSchema = z.object({
  email: z.string().min(1, "Email requis").email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const RegisterSchema = z
  .object({
    fullName: z.string().min(2, "Nom trop court").max(80, "Nom trop long"),
    orgName: z.string().min(2, "Organisation requise").max(80),
    email: z.string().min(1, "Email requis").email("Email invalide"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(passwordRules, "Min. 8, au moins 1 lettre et 1 chiffre"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
