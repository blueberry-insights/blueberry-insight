"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

import { useAuthMotionProps } from "@/shared/hooks/useAuthMotion";

import { resetPasswordAction } from "@/app/(auth)/_actions";
import { FormSubmit } from "@/shared/ui/forms";

type ResetState = { ok: boolean; error?: string };

const ClientEmailSchema = z
  .string()
  .min(1, "Email requis")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide");

export default function ResetPage() {
  const [state, formAction] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    { ok: false, error: undefined }
  );

  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | undefined>(undefined);
  
  const motionProps = useAuthMotionProps();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = ClientEmailSchema.safeParse(email);
    if (!parsed.success) {
      e.preventDefault();
      setEmailErr(parsed.error.issues[0]?.message ?? "Email invalide");
      return;
    }
    setEmailErr(undefined);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 " +
    "transition";

  return (
    <div className="auth-bg grid min-h-screen place-items-center bg-background text-foreground px-4">
      <motion.div {...motionProps} className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">Blueberry Insight</h1>

        <form
          action={formAction}
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/30 bg-[rgba(255,255,255,0.4)] backdrop-blur p-8 space-y-4"
        >
          <h2 className="text-base font-semibold">Réinitialiser le mot de passe</h2>
          <p className="text-sm text-muted-foreground">
            Saisis ton email. Si un compte existe, tu recevras un lien sécurisé.
          </p>

          <input
            name="email"
            type="email"
            placeholder="Email"
            className={inputClass}
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailErr(undefined);
            }}
          />
          {emailErr && <p className="text-sm text-red-600">{emailErr}</p>}

          {state?.ok && (
            <p className="text-sm text-green-600">
              Si l’email existe, un lien a été envoyé.
            </p>
          )}
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <FormSubmit>Envoyer le lien</FormSubmit>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="font-medium text-sm text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
