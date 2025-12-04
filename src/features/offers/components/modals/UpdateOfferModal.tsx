"use client";

import { useState, useTransition, useEffect } from "react";
import { updateOfferAction } from "@/app/(app)/offers/actions";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import type { OfferListItem, OfferStatus } from "@/core/models/Offer";
import { offerStatusValues } from "@/core/models/Offer";
import { useToast } from "@/shared/hooks/useToast";
import { AppModal } from "@/shared/ui/AppModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onClose: () => void;
  offer: OfferListItem | null;
  onUpdated: (offer: OfferListItem) => void;
};

const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

const INITIAL_VALUES = {
  title: "",
  description: "",
  status: "draft" as OfferStatus,
  city: "",
  isRemote: false,
  contractType: null as (typeof CONTRACT_TYPES)[number] | null,
};

export function UpdateOfferModal({
  open,
  onClose,
  offer,
  onUpdated,
}: Props) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Synchroniser le state local avec les props de l'offre à éditer
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !offer) {
      setIsInitialized(false);
      return;
    }

    const offerStatus = offer.status as OfferStatus | null;
    const normalizedStatus: OfferStatus =
      offerStatus && offerStatusValues.includes(offerStatus)
        ? offerStatus
        : "draft";

    setValues({
      title: offer.title ?? "",
      description: offer.description ?? "",
      status: normalizedStatus,
      city: offer.city ?? "",
      isRemote: offer.isRemote ?? false,
      contractType: (offer.contractType as (typeof CONTRACT_TYPES)[number] | null) ?? null,
    });
    setError(null);
    setIsInitialized(true);
  }, [open, offer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!offer) return null;

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!offer) {
      setError("Offre introuvable");
      return;
    }

    if (!values.title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.set("id", offer.id);
      form.set("title", values.title.trim());
      form.set("description", values.description.trim());
      form.set("status", values.status);

      if (values.city.trim()) {
        form.set("city", values.city.trim());
      }
      form.set("isRemote", values.isRemote ? "true" : "false");
      if (values.contractType) {
        form.set("contractType", values.contractType);
      }

      const res = await updateOfferAction(form);
      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la mise à jour";
        setError(errorMessage);
        toast.error({
          title: "Erreur de mise à jour",
          description: errorMessage,
        });
        return;
      }

      const updatedOffer = res.offer;
      toast.success({
        title: "Offre mise à jour",
        description: `L'offre "${updatedOffer.title}" a été mise à jour avec succès.`,
      });
      onUpdated(updatedOffer);
      onClose();
  
    });
  }

  return (
    <AppModal
      open={open && !!offer}
      onClose={onClose}
      title="Mise à jour de l'offre"
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
            form="update-offer-form"
            pendingOverride={pending}
          >
            {pending ? "Mise à jour..." : "Mettre à jour l'offre"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="update-offer-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Bloc 1 : Informations principales */}
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
              {isInitialized ? (
                <Select
                  key={`status-${offer.id}`}
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
              ) : (
                <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
              )}
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
              {isInitialized ? (
                <Select
                  key={`contractType-${offer.id}`}
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
              ) : (
                <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
              )}
            </div>
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
              Reste synthétique : l&apos;objectif est de qualifier les bons candidats, pas
              d&apos;écrire la fiche de poste complète.
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
