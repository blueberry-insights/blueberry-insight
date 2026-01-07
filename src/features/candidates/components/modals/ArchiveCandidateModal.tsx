"use client";

import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { AppModal } from "@/shared/ui/AppModal";

type Props = {
  open: boolean;
  candidate: CandidateListItem | null;
  offers: OfferListItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onArchived: () => void;
};

export function ArchiveCandidateModal({
  open,
  candidate,
  offers,
  isSubmitting,
  onClose,
  onArchived,
}: Props) {
  if (!open || !candidate) return null;

  const offerTitle =
    candidate.offerId
      ? offers.find((o) => o.id === candidate.offerId)?.title ?? "l'offre associée"
      : "l'offre associée";

  return (
    <AppModal open={open} onClose={onClose} isBusy={isSubmitting} title="Archiver ce candidat ?">
        <p className="mb-4 text-sm text-slate-600">
          Vous êtes sur le point d&apos;archiver{" "}
          <span className="font-semibold">{candidate.fullName}</span>{" "}
          au poste de{" "}
          <span className="font-semibold">{offerTitle}</span>.{" "}
          Le candidat sera retiré des listes par défaut.{" "}
          Les données (y compris le CV s&apos;il existe) restent conservées pour l&apos;historique.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onArchived}
            disabled={isSubmitting}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {isSubmitting ? "Archivage..." : "Archiver le candidat"}
          </button>
        </div>
      </AppModal>
  );
}
