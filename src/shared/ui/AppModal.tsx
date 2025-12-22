// src/shared/ui/AppModal.tsx
"use client";

import type { ReactNode } from "react";
import { useId } from "react";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  isBusy?: boolean;
};

export function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  isBusy = false,
}: AppModalProps) {
  const titleId = useId();

  if (!open) return null;

  const maxWidth =
    width === "sm"
      ? "max-w-md"
      : width === "lg"
      ? "max-w-3xl"
      : "max-w-2xl";

  function requestClose() {
    if (isBusy) return;
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!closeOnOverlayClick) return;
    if (isBusy) return;
    // clic sur l’overlay uniquement
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!closeOnEscape) return;
    if (e.key === "Escape") requestClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in duration-150`}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={requestClose}
            disabled={isBusy}
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline disabled:opacity-60"
          >
            Fermer
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-5">{children}</div>

        {/* FOOTER */}
        {footer && (
          <div className="mt-8 flex gap-3 border-t pt-4 border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
