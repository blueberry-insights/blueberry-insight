"use client";

import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  open: boolean;
  candidate: CandidateListItem | null;
  offers: OfferListItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteCandidateModal({
  open,
  candidate,
  offers,
  isSubmitting,
  onClose,
  onDeleted,
}: Props) {
  if (!open || !candidate) return null;

  const offerTitle =
    candidate.offerId
      ? offers.find((o) => o.id === candidate.offerId)?.title ?? "l'offre associée"
      : "l'offre associée";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Supprimer ce candidat ?
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Vous êtes sur le point de supprimer{" "}
          <span className="font-semibold">{candidate.fullName}</span>{" "}
          au poste de{" "}
          <span className="font-semibold">{offerTitle}</span>.{" "}
          Cette action est <span className="font-semibold">définitive</span> et
          supprimera également son CV s&apos;il est présent.
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
            onClick={onDeleted}
            disabled={isSubmitting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isSubmitting ? "Suppression..." : "Supprimer le candidat"}
          </button>
        </div>
      </div>
    </div>
  );
}
