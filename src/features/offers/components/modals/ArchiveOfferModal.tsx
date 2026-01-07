"use client";

import type { OfferListItem } from "@/core/models/Offer";
import { AppModal } from "@/shared/ui/AppModal";

type Props = {
  open: boolean;
  offer: OfferListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ArchiveOfferModal({
  open,
  offer,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !offer) return null;

  return (
    <AppModal open={open} onClose={onClose} isBusy={isSubmitting} title="Archiver cette offre ?"  footer={
      <>
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
          {isSubmitting ? "Archivage..." : "Archiver l'offre"}
        </button>
      </>
    }>
   
        <p className="mb-4 text-sm text-slate-600">
          Vous êtes sur le point d&apos;archiver{" "}
          <span className="font-semibold">{offer.title}</span>.
          L&apos;offre ne sera plus visible dans les listes par défaut.
        </p>
          
    </AppModal>
  );
}
