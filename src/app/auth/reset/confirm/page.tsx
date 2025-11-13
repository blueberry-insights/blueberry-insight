// app/auth/reset/confirm/page.tsx  — CLIENT COMPONENT, même design que login
"use client";
import { useState, useActionState } from "react";
import Link from "next/link";
import { z } from "zod";
import { updatePasswordAction } from "@/app/(auth)/_actions";
import { FormSubmit } from "@/shared/ui/FormSubmit";
import { getPasswordStrength } from "@/shared/utils/passwordStrength";

type UpdateState = { ok: boolean; error?: string };

const UpdateClientSchema = z
  .object({
    password: z.string().min(8, "Au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export default function ResetConfirmPage() {
 const [state, formAction] = useActionState<UpdateState, FormData>(
  updatePasswordAction,
  { ok: false, error: undefined }
);
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof values>>({});

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = UpdateClientSchema.safeParse(values);
    if (!parsed.success) {
      e.preventDefault();
      const errs: Partial<typeof values> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof values;
        errs[k] ??= issue.message;
      }
      setFieldErrors(errs);
    }
  }

  const { score, label, color } = getPasswordStrength(values.password);
  const fillCount = Math.min(4, Math.max(1, score + 1));

  return (
    <div className="auth-bg grid place-items-center bg-background text-foreground">
      <h1 className="text-xl mb-4 font-semibold">Blueberry Insight</h1>

      <form
        action={formAction}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/30 bg-[rgba(255,255,255,0.4)] backdrop-blur p-8 space-y-4"
      >
        <h2 className="text-lg font-semibold">Définir un nouveau mot de passe</h2>

        <div className="space-y-1">
          <input
            name="password"
            type="password"
            placeholder="Nouveau mot de passe"
            className="w-full rounded-lg border p-2"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={[
                  "h-1 flex-1 rounded transition-colors",
                  i < fillCount ? color : "bg-gray-300/70",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Robustesse : {label}</p>
        </div>
        {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}

        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirmer le mot de passe"
          className="w-full rounded-lg border p-2"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <FormSubmit>Mettre à jour</FormSubmit>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
