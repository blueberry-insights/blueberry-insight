"use client";

import type { Test } from "@/core/models/Test";
import { AppModal } from "@/shared/ui/AppModal";

type Props = {
  open: boolean;
  test: Test | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ArchiveTestModal({
  open,
  test,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !test) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      isBusy={isSubmitting}
      title="Archiver ce test ?"
      footer={
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
            {isSubmitting ? "Archivage..." : "Archiver le test"}
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Vous êtes sur le point d&apos;archiver{" "}
        <span className="font-semibold">{test.name}</span>.
        Le test ne sera plus visible dans les listes par défaut.
      </p>
    </AppModal>
  );
}

