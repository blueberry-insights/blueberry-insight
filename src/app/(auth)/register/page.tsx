"use client";
import { useRegisterForm } from "./useRegisterForm";
import { TextInput } from "@/shared/ui/TextInput";

export default function RegisterPage() {
  const { values, errors, formError, submitting, set, onSubmit } = useRegisterForm();

  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
        <h1 className="text-lg font-semibold">Créer un compte</h1>

        {formError && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
        )}

        <TextInput
          label="Nom complet"
          placeholder="Julien Habibi"
          value={values.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          error={errors.fullName}
        />

        <TextInput
          label="Organisation"
          placeholder="Blueberry Insight"
          value={values.orgName}
          onChange={(e) => set("orgName", e.target.value)}
          error={errors.orgName}
        />

        <TextInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
        />

        <TextInput
          label="Mot de passe"
          type="password"
          placeholder="********"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
        />

        <TextInput
          label="Confirmer le mot de passe"
          type="password"
          placeholder="********"
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />

        <button
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Création..." : "Créer le compte"}
        </button>
      </form>
    </div>
  );
}
