
"use client";

import { useState, useTransition } from "react";
import { createCandidateAction } from "@/app/(app)/candidates/actions";
import { TextField } from "@/shared/ui/fields/TextField";
import { FormSubmit } from "@/shared/ui/FormSubmit";
import { GenericForm } from "@/shared/ui/GenericForm";
import type { CandidateListItem } from "@/core/models/Candidate";
import { candidateStatusValues } from "@/core/models/Candidate";

type Props = {
  open: boolean;
  onClose: () => void;
  orgId: string;
  onCreated: (c: CandidateListItem) => void;
};

export function CreateCandidateModal({ open, onClose, orgId, onCreated }: Props) {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    status: "new",
    source: "",
    tags: "",
    note: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!values.fullName.trim()) {
      setError("Le nom complet est obligatoire");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.set("orgId", orgId);
      form.set("fullName", values.fullName.trim());
      form.set("email", values.email.trim());
      form.set("status", values.status);
      form.set("source", values.source.trim());
      form.set("tags", values.tags.trim());
      form.set("note", values.note.trim());

      const res = await createCandidateAction(form);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la création");
        return;
      }

      onCreated(res.candidate);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Nouveau candidat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:underline"
          >
            Fermer
          </button>
        </div>

        {/* 🔁 ici on n'utilise PAS action, on pilote tout en JS */}
        <GenericForm onSubmit={handleSubmit}>
          <TextField
            name="fullName"
            label="Nom complet"
            placeholder="Prénom Nom"
            value={values.fullName}
            onChange={(v) => set("fullName", v)}
          />

          <TextField
            name="email"
            type="email"
            label="Email"
            placeholder="email@exemple.com"
            value={values.email}
            onChange={(v) => set("email", v)}
          />

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Statut
            </label>
            <select
              name="status"
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition"
              value={values.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {candidateStatusValues.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <TextField
            name="source"
            label="Source"
            placeholder="LinkedIn, cooptation, site carrière…"
            value={values.source}
            onChange={(v) => set("source", v)}
          />

          {/* Tags */}
          <TextField
            name="tags"
            label="Tags"
            placeholder="ex: frontend, typescript, senior"
            value={values.tags}
            onChange={(v) => set("tags", v)}
          />

          {/* Note */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Note interne
            </label>
            <textarea
              name="note"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormSubmit>
            {pending ? "Création..." : "Créer le candidat"}
          </FormSubmit>
        </GenericForm>
      </div>
    </div>
  );
}
