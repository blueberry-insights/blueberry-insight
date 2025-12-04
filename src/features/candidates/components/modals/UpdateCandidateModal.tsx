"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { updateCandidateAction } from "@/app/(app)/candidates/actions";

import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import type {
  CandidateListItem,
  CandidateStatus,
} from "@/core/models/Candidate";
import { candidateStatusValues } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
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
  candidate: CandidateListItem | null;
  orgId: string;
  onUpdated: (c: CandidateListItem) => void;
  offers: OfferListItem[];
  isSubmitting: boolean;
};

const INITIAL_VALUES = {
  fullName: "",
  email: "",
  status: "new" as CandidateStatus,
  source: "",
  tags: "",
  note: "",
  offerId: "",
};

export function UpdateCandidateModal({
  open,
  onClose,
  candidate,
  onUpdated,
  offers,
}: Props) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Synchroniser le state local avec les props du candidat à éditer
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !candidate) {
      setIsInitialized(false);
      return;
    }

    const candidateStatus = candidate.status as CandidateStatus | null;
    const normalizedStatus: CandidateStatus =
      candidateStatus && candidateStatusValues.includes(candidateStatus)
        ? candidateStatus
        : "new";

    setValues({
      fullName: candidate.fullName ?? "",
      email: candidate.email ?? "",
      status: normalizedStatus,
      source: candidate.source ?? "",
      tags: candidate.tags?.join(", ") ?? "",
      note: candidate.note ?? "",
      offerId: candidate.offerId ?? "",
    });
    setError(null);
    setIsInitialized(true);
  }, [open, candidate, offers.length]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const offerSelectValue = useMemo(() => {
    if (!values.offerId || values.offerId.trim() === "") {
      return "none";
    }
    const offerExists = offers.some((o) => o.id === values.offerId);
    return offerExists ? values.offerId : "none";
  }, [values.offerId, offers]);

  if (!candidate) return null;

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!candidate) {
      setError("Candidat introuvable");
      return;
    }

    if (!values.fullName.trim()) {
      setError("Le nom complet est obligatoire");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.set("id", candidate.id);
      form.set("fullName", values.fullName.trim());
      form.set("email", values.email.trim());
      form.set("status", values.status);
      form.set("source", values.source.trim());
      form.set("tags", values.tags.trim());
      form.set("note", values.note.trim());
      form.set("offerId", values.offerId);

      const res = await updateCandidateAction(form);
      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la mise à jour";
        setError(errorMessage);
        toast.error({
          title: "Erreur de mise à jour",
          description: errorMessage,
        });
        return;
      }

      const updatedCandidate = res.candidate;

      toast.success({
        title: "Candidat mis à jour",
        description: `Les informations de ${updatedCandidate.fullName} ont été mises à jour avec succès.`,
      });
      onUpdated(updatedCandidate);
      onClose();
    });
  }

  return (
    <AppModal
      open={open && !!candidate}
      onClose={onClose}
      title="Mise à jour du candidat"
      width="lg"
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
            form="update-candidate-form"
            pendingOverride={pending}
          >
            {pending ? "Mise à jour..." : "Mettre à jour le candidat"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="update-candidate-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Informations principales
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Statut */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Statut du candidat
              </label>
              {isInitialized ? (
                <Select
                  key={`status-${candidate.id}`}
                  value={values.status}
                  onValueChange={(v) => set("status", v as CandidateStatus)}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
              )}
            </div>

            {/* Offre associée */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Offre associée
              </label>
              {isInitialized ? (
                <Select
                  key={`offer-${candidate.id}`}
                  value={offerSelectValue}
                  onValueChange={(v) => set("offerId", v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {offers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
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

        {/* Bloc 2 : Source & tags */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sourcing & profil
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              name="source"
              label="Source"
              placeholder="LinkedIn, cooptation, site carrière…"
              value={values.source}
              onChange={(v) => set("source", v)}
            />

            <TextField
              name="tags"
              label="Tags"
              placeholder="ex : frontend, typescript, senior"
              value={values.tags}
              onChange={(v) => set("tags", v)}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Les tags restent un champ libre pour l’instant : tu pourras les
            exploiter plus tard pour la recherche avancée.
          </p>
        </section>

        {/* Bloc 3 : Note interne */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Note interne
          </p>

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
            <p className="text-[10px] text-slate-400">
              Visible uniquement en interne : contexte, ressentis, next steps…
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
