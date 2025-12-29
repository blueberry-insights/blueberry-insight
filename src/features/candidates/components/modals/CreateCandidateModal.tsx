"use client";

import { useEffect, useState, useTransition } from "react";
import { createCandidateAction } from "@/app/(app)/candidates/actions";
import { uploadCandidateCvAction } from "@/app/(app)/candidates/[id]/actions";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import type { CandidateListItem, CandidateStatus } from "@/core/models/Candidate";
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

const INITIAL_VALUES = {
  fullName: "",
  email: "",
  location: "",
  phone: "",
  status: "new" as CandidateStatus,
  source: "",
  tags: "",
  note: "",
  offerId: "",
};

export function CreateCandidateModal({
  open,
  onClose,
  orgId,
  onCreated,
  offers,
}: Props) {
  const [values, setValues] = useState(INITIAL_VALUES);

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

    startTransition(async () => {
      const form = new FormData();
      form.set("orgId", orgId);
      form.set("fullName", values.fullName.trim());
      form.set("email", values.email.trim());
      form.set("location", values.location.trim());
      form.set("phone", values.phone.trim());
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

      const createdCandidate = res.candidate as CandidateListItem;

      // Si un CV est fourni -> on tente l'upload comme avant
      if (cvFile) {
        const cvForm = new FormData();
        cvForm.set("candidateId", createdCandidate.id);
        cvForm.set("cv", cvFile);

        const uploadRes = await uploadCandidateCvAction(cvForm);

        if (!uploadRes.ok) {
          toast.warning({
            title: "Candidat créé",
            description:
              "Le candidat a été créé, mais l'upload du CV a échoué. vous pourrez téléverser le CV depuis sa fiche.",
          });
          onCreated(createdCandidate);
          onClose();
          return;
        }

        toast.success({
          title: "Candidat créé",
          description: `${createdCandidate.fullName} a été ajouté avec succès (CV inclus).`,
        });
        onCreated(uploadRes.candidate as CandidateListItem);
        onClose();
        return;
      }

      toast.success({
        title: "Candidat créé",
        description: `${createdCandidate.fullName} a été ajouté sans CV. Vous pourrez ajouter le CV plus tard depuis sa fiche.`,
      });
      onCreated(createdCandidate);
      onClose();
    });
  }

  function resetLocalState() {
    setValues(INITIAL_VALUES);
    setError(null);
    setCvFile(null);
    setCvError(null);
  }

  function handleClose() {
    resetLocalState(); 
    onClose();        
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    setValues(INITIAL_VALUES);
    setError(null);
    setCvFile(null);
    setCvError(null);
  }, [open]);

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
            onClick={handleClose}
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
        {/* Bloc 1 : CV (recommandé, plus obligatoire) */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CV du candidat
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              CV <span className="text-slate-400 text-[11px]">(optionnel)</span>
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
              {cvError && <p className="text-[11px] text-red-600">{cvError}</p>}
              <p className="text-[10px] text-slate-400">
                Format PDF recommandé. Si tu n&apos;as pas le CV sous la main,
                tu pourras l&apos;ajouter plus tard depuis la fiche candidat.
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
              value={values.fullName || ""}
              onChange={(v) => set("fullName", v)}
            />

            <TextField
              name="email"
              type="email"
              label="Email"
              placeholder="email@exemple.com"
              value={values.email || ""}
              onChange={(v) => set("email", v)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              name="location"
              label="Localisation"
              placeholder="Paris, France"
              value={values.location || ""}
              onChange={(v) => set("location", v)}
            />

            <TextField
              name="phone"
              type="text"
              label="Téléphone"
              placeholder="06 06 06 06 06"
              value={values.phone || ""}
              onChange={(v) => set("phone", v)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Statut */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Statut du candidat
              </label>
              <Select
                value={values.status || "new"}
                onValueChange={(v) => set("status", v as CandidateStatus)}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
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
                <SelectContent className="z-[100]">
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
              value={values.source || ""}
              onChange={(v) => set("source", v)}
            />

            <TextField
              name="tags"
              label="Tags"
              placeholder="ex : frontend, typescript, senior"
              value={values.tags || ""}
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
              value={values.note || ""}
              onChange={(e) => set("note", e.target.value)}
            />
            <p className="text-[10px] text-slate-400">
              Notes visibles uniquement par ton équipe : contexte, doutes, next
              steps…
            </p>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
