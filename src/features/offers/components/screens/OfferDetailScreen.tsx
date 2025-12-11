"use client";

import { Briefcase, Edit } from "lucide-react";
import { useState } from "react";
import type { Offer } from "@/core/models/Offer";
import type { CandidateListItem } from "@/core/models/Candidate";
import { DetailTwoColumnLayout } from "@/shared/ui/layout";
import { Button } from "@/components/ui/button";
import {
  OfferInfoSection,
  OfferDescriptionSection,
  OfferSalarySection,
  OfferCandidatesSection,
} from "../sections/details";
import { UpdateOfferModal } from "../modals";
import { OfferStatusBadge } from "../ui";

type Props = {
  offer: Offer;
  candidates: CandidateListItem[];
};

export function OfferDetailScreen({ offer: initialOffer, candidates }: Props) {
  const [offer, setOffer] = useState(initialOffer);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const left = (
    <>
      <OfferInfoSection offer={offer} />
      <OfferDescriptionSection offer={offer} />
      <OfferSalarySection offer={offer} />
      <OfferCandidatesSection candidates={candidates} />
    </>
  );

  const right = (
    <>
      {/* Actions rapides */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Actions rapides
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-center text-sm"
            onClick={() => setUpdateModalOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier l&apos;offre
          </Button>
          <Button variant="outline" className="w-full justify-center text-sm">
            Dupliquer l&apos;offre
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-center text-sm text-rose-600 hover:text-rose-700"
          >
            Archiver l&apos;offre
          </Button>
        </div>
      </section>

      {/* Statistiques */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Statistiques
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Total candidats</span>
            <span className="font-medium text-slate-900">
              {candidates.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Vues</span>
            <span className="font-medium text-slate-900">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Candidatures</span>
            <span className="font-medium text-slate-900">—</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Les statistiques détaillées seront disponibles prochainement.
        </p>
      </section>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-xl border bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold leading-tight">
                {offer.title}
              </h1>
              <OfferStatusBadge status={offer.status} />
            </div>

            <p className="text-sm text-muted-foreground">
              {offer.city
                ? `${offer.city}${offer.country ? `, ${offer.country}` : ""}`
                : "Localisation non précisée"}
              {offer.contractType && ` • ${offer.contractType}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          <Button className="text-sm">Publier l&apos;offre</Button>
        </div>
      </header>

      <DetailTwoColumnLayout leftColumn={left} rightColumn={right} />

      <UpdateOfferModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        offer={{
          ...offer,
          candidateCount: candidates.length,
          updatedAt: offer.updatedAt ?? offer.createdAt,
          responsibleUserName: null,
        }}
        onUpdated={(updatedOffer) => {
          setOffer({
            ...offer,
            title: updatedOffer.title,
            description: updatedOffer.description,
            status: updatedOffer.status,
            city: updatedOffer.city,
            country: updatedOffer.country,
            isRemote: updatedOffer.isRemote,
            contractType: updatedOffer.contractType,
            updatedAt: updatedOffer.updatedAt,
          });
        }}
      />
    </div>
  );
}
