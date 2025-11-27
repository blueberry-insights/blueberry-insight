"use client";
import { useState, useTransition } from "react";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { uploadCandidateCvAction } from "@/app/(app)/candidates/[id]/actions";
import { DetailTwoColumnLayout } from "@/shared/ui/layout";
import { Button } from "@/components/ui/button";
import { CandidateAvatar } from "./CandidateAvatar";
import { CandidateStatusBadge } from "./CandidateStatusBadge";
import {
  CandidateInfoSection,
  CandidateSkillsSection,
  CandidateCvSection,
  CandidateNotesSection,
  CandidateContextSection,
} from "./sections";


type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
  onUploadCv: (
    formData: FormData
  ) => Promise<{ ok: boolean; candidate?: CandidateListItem; error?: string }>;
};

export function CandidateDetailScreen({ candidate, offer, onUploadCv }: Props) {

    const [currentCandidate, setCurrentCandidate] = useState(candidate);
    const [isPending, startTransition] = useTransition();

    async function handleUploadCv(formData: FormData) {
        const result = await uploadCandidateCvAction(formData);
        if (result.ok) {
            setCurrentCandidate(result.candidate);
          } else {
            console.error("[handleUploadCv] error", result.error);
          }
      }
 
  const left = (
    <>
      <CandidateInfoSection candidate={candidate} offer={offer} />
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
      <CandidateContextSection candidate={currentCandidate} offer={offer} />
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Actions rapides
        </h3>
        <CandidateCvSection candidate={currentCandidate} onUploadCv={handleUploadCv}  disabled={isPending} />
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-center text-sm">
            Associer à une offre
          </Button>
          <Button asChild variant="outline" className="w-full justify-center text-sm">
          <a
              href={`/api/candidates/${candidate.id}/cv`}
              target="_blank"
              rel="noreferrer"
            >
            Télécharger le CV
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
          <CandidateAvatar name={candidate.fullName} size="lg" className="mt-0.5" />

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


