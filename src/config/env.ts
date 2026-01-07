/**
 * Validation des variables d'environnement au démarrage.
 * 
 * Utilise Zod pour valider et typer toutes les variables d'environnement.
 * L'application ne démarrera pas si les variables requises sont manquantes ou invalides.
 */
import { z } from "zod";

const envSchema = z.object({
  // Supabase - Requis
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL doit être une URL valide")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL est requis"),

  // Clé Supabase - Au moins une des deux doit être présente
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Service Role Key - Requis pour les opérations admin
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY est requis")
    .refine(
      (val) => val.startsWith("eyJ") || val.length > 50,
      "SUPABASE_SERVICE_ROLE_KEY semble invalide"
    ),

  // App URL - Optionnel (utilisé pour les callbacks email)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      "NEXT_PUBLIC_APP_URL doit être une URL valide si fourni"
    ),

  // Basic Auth - Optionnel (pour protéger l'environnement de staging)
  BASIC_AUTH_USER: z.string().optional(),
  BASIC_AUTH_PASS: z.string().optional(),

  // Vercel - Optionnel (fourni automatiquement par Vercel)
  VERCEL_URL: z.string().optional(),
  BLUEBERRY_ORG_ID: z.string().optional(),
});

// Valider et parser les variables d'environnement
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path}: ${issue.message}`;
    });

    throw new Error(
      `❌ Variables d'environnement invalides :\n${errors.join("\n")}\n\n` +
        "Vérifie ton fichier .env.local ou les variables d'environnement de ton déploiement."
    );
  }

  // Vérifier qu'au moins une clé Supabase est présente
  if (
    !parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    !parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "❌ Au moins une de ces variables doit être définie :\n" +
        "  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\n" +
        "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return parsed.data;
}

// Exporter les variables validées
export const env = validateEnv();

// Types pour TypeScript
export type Env = typeof env;

