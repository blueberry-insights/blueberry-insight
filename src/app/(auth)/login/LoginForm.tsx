
"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

import { loginAction } from "../_actions";

import { useAuthMotionProps } from "@/shared/hooks/useAuthMotion";

import { FormSubmit } from "@/shared/ui/FormSubmit";
import { GenericForm } from "@/shared/ui/GenericForm";
import { TextField } from "@/shared/ui/fields/TextField";

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

  const motionProps = useAuthMotionProps()

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
  }
  
  return (
    <>
      <motion.div {...motionProps} className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center text-foreground">Blueberry Insights</h1>

        <GenericForm action={loginAction} onSubmit={onSubmit}>
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <h2 className="text-lg font-semibold text-foreground">Connexion</h2>

          {resetSuccess && (
            <p className="text-sm text-green-600">
              Mot de passe mis à jour. Tu peux te reconnecter.
            </p>
          )}

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <TextField
            name="email"
            type="email"
            label="Email"
            placeholder="ton.email@exemple.com"
            autoComplete="username"
            value={values.email}
            onChange={(v) => set("email", v)}
            error={fieldErrors.email}
          />

          <TextField
            name="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            autoComplete="current-password"
            value={values.password}
            onChange={(v) => set("password", v)}
            error={fieldErrors.password}
            withPasswordToggle
          />

          <div className="flex items-center justify-between">
            <span />
            <Link href="/auth/reset" className="text-xs text-primary hover:opacity-90">
              Mot de passe oublié ?
            </Link>
          </div>
          <FormSubmit>Se connecter</FormSubmit>
          <p className="text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </GenericForm>
      </motion.div>
    </>
  );
}
