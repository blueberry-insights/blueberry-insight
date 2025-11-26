"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

import { registerAction } from "../_actions";

import { getPasswordStrength } from "@/shared/utils/passwordStrength";
import { useAuthMotionProps } from "@/shared/hooks/useAuthMotion";

import { FormSubmit, AuthForm, TextField } from "@/shared/ui/forms";

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

    const motionProps = useAuthMotionProps();

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
    }

    const { score, label, color } = getPasswordStrength(values.password);
    const hasPassword = values.password.length > 0;
    const fillCount = Math.min(4, Math.max(1, score + 1));


    return (
        <>
            <motion.div {...motionProps} className="w-full max-w-md space-y-4">
                <h1 className="text-xl font-semibold text-center text-foreground">
                    Blueberry Insight
                </h1>

                <AuthForm action={registerAction} onSubmit={onSubmit}>
                    <h2 className="text-lg font-semibold text-foreground">
                        Créer un compte
                    </h2>

                    {serverError && (
                        <p className="text-sm text-red-600">{serverError}</p>
                    )}

                    <TextField
                        name="fullName"
                        label="Nom complet"
                        placeholder="Ton nom complet"
                        value={values.fullName}
                        onChange={(v) => set("fullName", v)}
                        error={fieldErrors.fullName}
                    />

                    <TextField
                        name="orgName"
                        label="Organisation"
                        placeholder="Nom de l’organisation"
                        value={values.orgName}
                        onChange={(v) => set("orgName", v)}
                        error={fieldErrors.orgName}
                    />

                    <TextField
                        name="email"
                        type="email"
                        label="Email professionnel"
                        placeholder="ton.email@exemple.com"
                        autoComplete="email"
                        value={values.email}
                        onChange={(v) => set("email", v)}
                        error={fieldErrors.email}
                    />

                    <div className="space-y-1">
                        <TextField
                            name="password"
                            type="password"
                            label="Mot de passe"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            value={values.password}
                            onChange={(v) => set("password", v)}
                            error={fieldErrors.password}
                            withPasswordToggle
                        />

                        {hasPassword && (
                            <>
                                <div className="flex gap-1">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={[
                                                "h-1 flex-1 rounded transition-colors",
                                                i < fillCount ? color : "bg-slate-200/80",
                                            ].join(" ")}
                                        />
                                    ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Robustesse : {label}
                                </p>
                            </>
                        )}
                    </div>

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

                    <FormSubmit>Créer mon compte</FormSubmit>

                    <p className="text-center text-sm text-muted-foreground">
                        Tu as déjà un compte ?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Se connecter
                        </Link>
                    </p>
                </AuthForm>
            </motion.div>
        </>
    );
}
