"use client";

import { useState, useTransition } from "react";
import { createCandidateAction } from "@/app/(app)/candidates/actions";
import { uploadCandidateCvAction } from "@/app/(app)/candidates/[id]/actions";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import type { CandidateListItem } from "@/core/models/Candidate";
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
  orgId: string;
  onCreated: (c: CandidateListItem) => void;
  offers: OfferListItem[];
};

export function CreateCandidateModal({
  open,
  onClose,
  orgId,
  onCreated,
  offers,
}: Props) {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    status: "new",
    source: "",
    tags: "",
    note: "",
    offerId: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCvFile(file);
    setCvError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCvError(null);

    if (!values.fullName.trim()) {
      setError("Le nom complet est obligatoire");
      return;
    }

    if (!cvFile) {
      setCvError("Le CV est obligatoire");
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
      form.set("offerId", values.offerId);

      const res = await createCandidateAction(form);
      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la création";
        setError(errorMessage);
        toast.error({
          title: "Erreur de création",
          description: errorMessage,
        });
        return;
      }

      const createdCandidate = res.candidate;

      const cvForm = new FormData();
      cvForm.set("candidateId", createdCandidate.id);
      cvForm.set("cv", cvFile);

      const uploadRes = await uploadCandidateCvAction(cvForm);

      if (!uploadRes.ok) {
        toast.warning({
          title: "Candidat créé",
          description:
            "Le candidat a été créé, mais l'upload du CV a échoué. Vous pourrez téléverser le CV depuis sa fiche.",
        });
        onCreated(createdCandidate);
        onClose();
        return;
      }

      toast.success({
        title: "Candidat créé",
        description: `${createdCandidate.fullName} a été ajouté avec succès.`,
      });
      onCreated(uploadRes.candidate);
      onClose();
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Nouveau candidat"
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
            form="create-candidate-form"
            pendingOverride={pending}
          >
            {pending ? "Création..." : "Créer le candidat"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="create-candidate-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Bloc 1 : CV obligatoire */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CV du candidat
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              CV <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3">
              <input
                type="file"
                name="cv"
                accept="application/pdf,.pdf"
                onChange={handleCvChange}
                className="w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
              />
              {cvFile && (
                <p className="text-[11px] text-slate-500">
                  Fichier sélectionné :{" "}
                  <span className="font-medium">{cvFile.name}</span>
                </p>
              )}
              {cvError && (
                <p className="text-[11px] text-red-600">{cvError}</p>
              )}
              <p className="text-[10px] text-slate-400">
                Format PDF uniquement. Le CV sera stocké de manière sécurisée dans
                l&apos;espace de ton organisation.
              </p>
            </div>
          </div>
        </section>

        {/* Bloc 2 : Infos principales */}
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
              <Select
                value={values.status}
                onValueChange={(v) => set("status", v)}
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
            </div>

            {/* Offre associée */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Offre associée
              </label>
              <Select
                value={values.offerId || "none"}
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
            </div>
          </div>
        </section>

        {/* Bloc 3 : Source & tags */}
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
            Les tags te serviront plus tard pour les recherches et les tests
            situationnels ciblés.
          </p>
        </section>

        {/* Bloc 4 : Note interne */}
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
              Notes visibles uniquement par ton équipe : contexte, doutes, next steps…
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
