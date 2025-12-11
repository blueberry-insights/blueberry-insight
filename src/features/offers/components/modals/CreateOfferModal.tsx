// src/features/offers/components/CreateOfferModal.tsx
"use client";

import { useState, useTransition } from "react";
import { createOfferAction } from "@/app/(app)/offers/actions";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import type { OfferListItem, OfferStatus } from "@/core/models/Offer";
import { offerStatusValues } from "@/core/models/Offer";
import { AppModal } from "@/shared/ui/AppModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/shared/hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (offer: OfferListItem) => void;
};

const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

export function CreateOfferModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [values, setValues] = useState({
    title: "",
    description: "",
    status: "draft" as OfferStatus,
    city: "",
    isRemote: false,
    contractType: null as (typeof CONTRACT_TYPES)[number] | null,
    salaryMin: "",
    salaryMax: "",
    currency: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      form.set("salaryMin", values.salaryMin ?? "");
      form.set("salaryMax", values.salaryMax ?? "");
      form.set("currency", values.currency ?? "");  

      if (values.city.trim()) {
        form.set("city", values.city.trim());
      }
      form.set("isRemote", values.isRemote ? "true" : "false");
      if (values.contractType) {
        form.set("contractType", values.contractType);
      }

      const res = await createOfferAction(form);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la création");
        return;
      }

      toast.success({
        title: "Offre créée",
        description: `L'offre "${res.offer.title}" a été créée avec succès.`,
      });
      onCreated(res.offer);
      onClose();
      setValues({
        title: "",
        description: "",
        status: "draft" as OfferStatus,
        city: "",
        isRemote: false,
        contractType: null,
        salaryMin: "",
        salaryMax: "",
        currency: "",
      });
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Nouvelle offre"
      width="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <FormSubmit
            className="flex-1"
            form="create-offer-form"
          >
            {pending ? "Création..." : "Créer l'offre"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="create-offer-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Informations principales
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <TextField
              name="title"
              label="Titre de l'offre"
              placeholder="Ex : Senior Frontend Engineer"
              value={values.title}
              onChange={(v) => set("title", v)}
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Statut de l&apos;offre
              </label>
              <Select
                value={values.status}
                onValueChange={(v) => set("status", v as OfferStatus)}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  {offerStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400">
                <span className="font-medium">draft</span> = interne,{" "}
                <span className="font-medium">published</span> = activement ouverte.
              </p>
            </div>
          </div>
        </section>

        {/* Bloc 2 : Contexte & localisation */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contexte & localisation
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              name="city"
              label="Ville principale"
              placeholder="Ex : Paris, Lyon…"
              value={values.city}
              onChange={(v) => set("city", v)}
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Télétravail
              </label>
              <button
                type="button"
                onClick={() => set("isRemote", !values.isRemote)}
                className={`flex h-9 w-full items-center justify-between rounded-lg border px-3 text-xs transition ${
                  values.isRemote
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>
                  {values.isRemote
                    ? "Remote friendly / full remote"
                    : "Principalement sur site"}
                </span>
                <span
                  className={`h-4 w-8 rounded-full border transition ${
                    values.isRemote
                      ? "border-emerald-500 bg-emerald-500/80"
                      : "border-slate-300 bg-slate-200"
                  }`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full bg-white shadow transition translate-y-[2px] ${
                      values.isRemote ? "translate-x-[18px]" : "translate-x-[2px]"
                    }`}
                  />
                </span>
              </button>
              <p className="text-[10px] text-slate-400">
                Tu pourras préciser la policy plus tard (jours sur site, fuseau, etc.).
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Type de contrat
              </label>
              <Select
                value={values.contractType ?? undefined}
                onValueChange={(v) =>
                  set("contractType", v as (typeof CONTRACT_TYPES)[number] | null)
                }
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                  <SelectValue placeholder="Non précisé" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              name="salaryMin"
              label="Salaire minimum"
              placeholder="Ex : 100000"
              value={values.salaryMin}
              onChange={(v) => set("salaryMin", v)}
            />
            <TextField
              name="salaryMax"
              label="Salaire maximum"
              placeholder="Ex : 150000"
              value={values.salaryMax}
              onChange={(v) => set("salaryMax", v)}
            />
            <TextField
              name="currency"
              label="Devise"
              placeholder="Ex : EUR"
              value={values.currency ?? ""}
              onChange={(v) => set("currency", v)}
            />
          </div>
        </section>

        {/* Bloc 3 : Description */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Description du poste
            </label>
            <textarea
              name="description"
              rows={5}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Contexte, missions clés, stack, équipe, reporting…"
            />
            <p className="text-[10px] text-slate-400">
              Reste synthétique : l’objectif est de qualifier les bons candidats, pas
              d’écrire la fiche de poste complète.
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
