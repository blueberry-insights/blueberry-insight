"use client";
import { useState, useTransition } from "react";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import {
  uploadCandidateCvAction,
  updateCandidateAction,
} from "@/app/(app)/candidates/[id]/actions";

import { DetailTwoColumnLayout } from "@/shared/ui/layout";
import { Button } from "@/components/ui/button";
import { CandidateAvatar, CandidateStatusBadge } from "../ui";

import {
  CandidateInfoSection,
  CandidateSkillsSection,
  CandidateCvSection,
  CandidateNotesSection,
  CandidateContextSection,
} from "../sections/details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/shared/hooks/useToast";

type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
  allOffers: OfferListItem[] | null;
};

export function CandidateDetailScreen({ candidate, allOffers }: Props) {
  const [currentCandidate, setCurrentCandidate] = useState(candidate);
  const [isPending, startTransition] = useTransition();

  const offerSelectValue = currentCandidate.offerId ?? "none";
  async function handleUploadCv(formData: FormData) {
    startTransition(async () => {
      const result = await uploadCandidateCvAction(formData);
      if (result.ok) {
        setCurrentCandidate(result.candidate);
      } else {
        console.error("[handleUploadCv] error", result.error);
      }
    });
  }

  async function handleAssociateOffer(offerId: string | null) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", currentCandidate.id);
      formData.set("offerId", offerId || "none");
      const result = await updateCandidateAction(formData);
      if (result.ok) {
        setCurrentCandidate(result.candidate);
        toast.success({
          title: "Offre mise à jour",
          description: offerId
            ? "L'offre a été associée au candidat"
            : "L'offre a été désassociée du candidat",
        });
      } else {
        console.error("[handleAssociateOffer] error", result.error);
        toast.error({
          title: "Erreur",
          description: result.error,
        });
      }
    });
  }

  const left = (
    <>
      <CandidateInfoSection candidate={candidate} offer={currentCandidate.offerId ? allOffers?.find((o) => o.id === currentCandidate.offerId) ?? null : null} />
      <CandidateSkillsSection candidate={candidate} />
      <CandidateNotesSection candidate={candidate} />

      <section className="rounded-xl border bg-white px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Résultats de test
        </h2>
        <p className="text-sm text-muted-foreground">
          Les résultats de test apparaîtront ici une fois la fonctionnalité
          finalisée.
        </p>
      </section>
    </>
  );

  const right = (
    <>
      <CandidateContextSection candidate={currentCandidate} offer={currentCandidate.offerId ? allOffers?.find((o) => o.id === currentCandidate.offerId) ?? null : null} />
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Actions rapides
        </h3>
        <CandidateCvSection
          candidate={currentCandidate}
          onUploadCv={handleUploadCv}
          disabled={isPending}
        />
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Associer une offre
          </label>

          {isPending ? (
            <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
          ) : (
            <>
              <Select
                key={`offer-${currentCandidate.id}`}
                value={offerSelectValue}
                onValueChange={(v) => {
                  const offerId = v === "none" ? null : v;
                  handleAssociateOffer(offerId);
                }}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {allOffers &&
                    allOffers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="offerId" value={offerSelectValue} />
            </>
          )}
          <Button
            asChild
            variant="outline"
            className="w-full justify-center text-sm"
          >
            <a
              href={`/api/candidates/${candidate.id}/cv`}
              target="_blank"
              rel="noreferrer"
            >
              Afficher le CV
            </a>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-center text-sm text-rose-600 hover:text-rose-700"
          >
            Supprimer le candidat
          </Button>
        </div>
      </section>

      {/* Historique */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Historique
        </h3>
        <p className="text-sm text-muted-foreground">
          L&apos;historique des actions (tests envoyés, changements de statut…)
          sera affiché ici plus tard.
        </p>
      </section>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-xl border bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <CandidateAvatar
            name={candidate.fullName}
            size="lg"
            className="mt-0.5"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold leading-tight">
                {candidate.fullName}
              </h1>
              {candidate.status && (
                <CandidateStatusBadge status={candidate.status} />
              )}
            </div>

            {candidate.email && (
              <p className="text-sm text-muted-foreground">{candidate.email}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          <Button className="text-sm">Envoyer un test</Button>
        </div>
      </header>

      <DetailTwoColumnLayout leftColumn={left} rightColumn={right} />
    </div>
  );
}
