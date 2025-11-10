"use client";
import { useState } from "react";
import { services } from "@/app/container";
import { RegisterSchema, type RegisterInput } from "@/shared/validation/auth";

export function useRegisterForm() {
  const [values, setValues] = useState<RegisterInput>({
    fullName: "", orgName: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof RegisterInput>(key: K, v: RegisterInput[K]) {
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const parsed = RegisterSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof RegisterInput;
        fieldErrors[k] ??= issue.message;
      }
      setErrors(fieldErrors);
      setSubmitting(false);
      return;
    }

    try {
      await services.registerUser(values.email, values.password, { full_name: values.fullName.trim() });
      localStorage.setItem("pendingOrgName", values.orgName.trim());
      alert("Compte créé. Connecte-toi !");
      location.assign("/login");
    } catch (err: any) {
      setFormError(err?.message || "Échec de l’inscription.");
    } finally {
      setSubmitting(false);
    }
  }

  return { values, errors, formError, submitting, set, onSubmit };
}
