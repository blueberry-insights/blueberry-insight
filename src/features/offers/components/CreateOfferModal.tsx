"use client";

import { useState, useTransition } from "react";
import { createOfferAction } from "@/app/(app)/offers/actions";
import { TextField } from "@/shared/ui/fields/TextField";
import { FormSubmit } from "@/shared/ui/FormSubmit";
import { GenericForm } from "@/shared/ui/GenericForm";
import type { Offer, OfferStatus } from "@/core/models/Offer";
import { offerStatusValues } from "@/core/models/Offer";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (offer: Offer) => void;
};

export function CreateOfferModal({ open, onClose, onCreated }: Props) {
  const [values, setValues] = useState({
    title: "",
    description: "",
    status: "draft" as OfferStatus,
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

    if (!values.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.set("title", values.title.trim());
      form.set("description", values.description.trim());
      form.set("status", values.status);

      const res = await createOfferAction(form);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la création");
        return;
      }

      onCreated(res.offer);
      onClose();
      setValues({ title: "", description: "", status: "draft" as OfferStatus });
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Nouvelle offre</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:underline"
          >
            Fermer
          </button>
        </div>

        <GenericForm onSubmit={handleSubmit}>
          <TextField
            name="title"
            label="Titre de l'offre"
            placeholder="Ex : Senior Frontend Engineer"
            value={values.title}
            onChange={(v) => set("title", v)}
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Statut
            </label>
            <select
              name="status"
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition"
              value={values.status}
              onChange={(e) => set("status", e.target.value as OfferStatus)}
            >
              {offerStatusValues.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Contexte, missions, stack, équipe…"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormSubmit>
            {pending ? "Création..." : "Créer l'offre"}
          </FormSubmit>
        </GenericForm>
      </div>
    </div>
  );
}
