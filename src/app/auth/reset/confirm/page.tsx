
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { motion } from "framer-motion";

import { useAuthMotionProps } from "@/shared/hooks/useAuthMotion";
import { FormSubmit, AuthForm, TextField } from "@/shared/ui/forms";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ClientUpdateSchema = z
  .object({
    password: z.string().min(8, "Au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export default function ResetConfirmPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const motionProps = useAuthMotionProps();

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
    if (globalError) setGlobalError(undefined);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(undefined);

    const parsed = ClientUpdateSchema.safeParse(values);
    if (!parsed.success) {
      const errs: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof values;
        errs[k] ??= issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("[ResetConfirm] updateUser error:", error);
        setGlobalError(
          error.message || "Impossible de mettre à jour le mot de passe."
        );
        setPending(false);
        return;
      }

      router.push("/login?reset=success");
    } catch (err: any) {
      console.error("[ResetConfirm] unexpected error:", err);
      setGlobalError("Erreur inattendue. Réessaie plus tard.");
      setPending(false);
    }
  }

  return (
    <div className="auth-bg grid min-h-screen place-items-center bg-background text-foreground px-4">
      <motion.div {...motionProps} className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">Blueberry Insight</h1>

        <AuthForm onSubmit={onSubmit}>
          <h2 className="text-base font-semibold">
            Définir un nouveau mot de passe
          </h2>
          <p className="text-sm text-muted-foreground">
            Choisis un nouveau mot de passe pour ton compte.
          </p>

          <TextField
            name="password"
            type="password"
            label="Nouveau mot de passe"
            placeholder="••••••••"
            autoComplete="new-password"
            value={values.password}
            onChange={(v) => set("password", v)}
            error={fieldErrors.password}
          />

          <TextField
            name="confirmPassword"
            type="password"
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
            error={fieldErrors.confirmPassword}
          />

          {globalError && (
            <p className="text-sm text-red-600">{globalError}</p>
          )}

          <FormSubmit>
            {pending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </FormSubmit>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </AuthForm>
      </motion.div>
    </div>
  );
}
