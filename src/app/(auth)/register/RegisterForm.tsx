"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { registerAction } from "../_actions";
import { getPasswordStrength } from "@/shared/utils/passwordStrength";
import { FormSubmit } from "@/shared/ui/FormSubmit";

const RegisterClientSchema = z
  .object({
    fullName: z.string().min(2, "Nom trop court"),
    orgName: z.string().min(2, "Organisation trop courte"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormProps = {
  serverError: string | null;
};

export default function RegisterForm({ serverError }: RegisterFormProps) {
  const [values, setValues] = useState({
    fullName: "",
    orgName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] =
    useState<Partial<Record<keyof typeof values, string>>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = RegisterClientSchema.safeParse(values);
    if (!parsed.success) {
      e.preventDefault();
      const errs: Partial<Record<keyof typeof values, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof typeof values;
        errs[k] ??= issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setPending(true);
  }

  const { score, label, color } = getPasswordStrength(values.password);
  const fillCount = Math.min(4, Math.max(1, score + 1));

  return (
    <div className="auth-bg grid place-items-center bg-background text-foreground">
      <h1 className="text-xl mb-4 font-semibold">Blueberry Insight</h1>

      <form
        action={registerAction}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/30 bg-[rgba(255,255,255,0.4)] backdrop-blur p-8 space-y-4"
      >
        <h2 className="text-lg font-semibold">Créer un compte</h2>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <input
          name="fullName"
          className="w-full rounded-lg border p-2"
          placeholder="Nom complet"
          value={values.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        {fieldErrors.fullName && (
          <p className="text-sm text-red-600">{fieldErrors.fullName}</p>
        )}

        <input
          name="orgName"
          className="w-full rounded-lg border p-2"
          placeholder="Organisation"
          value={values.orgName}
          onChange={(e) => set("orgName", e.target.value)}
        />
        {fieldErrors.orgName && (
          <p className="text-sm text-red-600">{fieldErrors.orgName}</p>
        )}

        <input
          name="email"
          className="w-full rounded-lg border p-2"
          placeholder="Email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {fieldErrors.email && (
          <p className="text-sm text-red-600">{fieldErrors.email}</p>
        )}

        <div className="space-y-1">
          <input
            name="password"
            className="w-full rounded-lg border p-2"
            placeholder="Mot de passe"
            type="password"
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
        {fieldErrors.password && (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        )}

        <input
          name="confirmPassword"
          className="w-full rounded-lg border p-2"
          placeholder="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
        )}

        <FormSubmit>Créer mon compte</FormSubmit>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
