"use client";

import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  open: boolean;
  offer: OfferListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteOfferModal({
  open,
  offer,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !offer) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Supprimer cette offre ?
        </h2>

        <p className="mb-4 text-sm text-slate-600">
          Vous êtes sur le point de supprimer{" "}
          <span className="font-semibold">{offer.title}</span>.
          Cette action est <span className="font-semibold">définitive</span>.
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
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isSubmitting ? "Suppression..." : "Supprimer l'offre"}
          </button>
        </div>
      </div>
    </div>
  );
}
