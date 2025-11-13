"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { loginAction } from "../_actions";
import { FormSubmit } from "@/shared/ui/FormSubmit";

const LoginClientSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Au moins 6 caractères"),
});

type LoginFormProps = {
  redirectTo: string;
  serverError: string | null;
  resetSuccess?: boolean;
};

export default function LoginForm({ redirectTo, serverError, resetSuccess }: LoginFormProps) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = LoginClientSchema.safeParse(values);
    if (!parsed.success) {
      e.preventDefault();
      const errs: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "email" | "password";
        errs[k] ??= issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setPending(true);
  }

  return (
    <div className="auth-bg grid place-items-center bg-background text-foreground">
      <h1 className="text-xl mb-4 font-semibold">Blueberry Insight</h1>
      <form
        action={loginAction}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/30 bg-[rgba(255,255,255,0.4)] backdrop-blur p-8 space-y-4"
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <h2 className="text-lg font-semibold">Connexion</h2>

        {resetSuccess && (
          <p className="text-sm text-green-600">
            Mot de passe mis à jour. Tu peux te reconnecter.
          </p>
        )}

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border p-2"
          value={values.email}
          autoComplete="username"
          onChange={(e) => set("email", e.target.value)}
        />
        {fieldErrors.email && <p className="text-sm text-red-600">{fieldErrors.email}</p>}

        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          className="w-full rounded-lg border p-2"
          value={values.password}
          autoComplete="current-password"
          onChange={(e) => set("password", e.target.value)}
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        )}

        <FormSubmit>Se connecter</FormSubmit>

        <div className="flex items-center justify-between">
          <span />
          <Link href="/auth/reset" className="text-sm text-primary hover:opacity-90">
            Mot de passe oublié ?
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
