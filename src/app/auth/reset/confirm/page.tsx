// src/app/auth/reset/confirm/page.tsx
"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

import { useAuthMotionProps } from "@/shared/hooks/useAuthMotion";
import { updatePasswordAction } from "@/app/(auth)/_actions";
import { FormSubmit } from "@/shared/ui/FormSubmit";
import { GenericForm } from "@/shared/ui/GenericForm";
import { TextField } from "@/shared/ui/fields/TextField";

type UpdateState = { ok: boolean; error?: string };

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
  const [state, formAction] = useActionState<UpdateState, FormData>(
    updatePasswordAction,
    { ok: false, error: undefined }
  );

  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const motionProps = useAuthMotionProps();

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = ClientUpdateSchema.safeParse(values);
    if (!parsed.success) {
      e.preventDefault();
      const errs: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof values;
        errs[k] ??= issue.message;
      }
      setFieldErrors(errs);
      return;
    }
  }

  return (
    <div className="auth-bg grid min-h-screen place-items-center bg-background text-foreground px-4">
      <motion.div {...motionProps} className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">Blueberry Insight</h1>

        <GenericForm action={formAction} onSubmit={onSubmit}>
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

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <FormSubmit>Mettre à jour le mot de passe</FormSubmit>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </p>
        </GenericForm>
      </motion.div>
    </div>
  );
}
