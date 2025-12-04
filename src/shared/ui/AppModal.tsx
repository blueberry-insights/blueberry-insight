// src/shared/ui/AppModal.tsx
"use client";

import type { ReactNode } from "react";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
};

export function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "md",
}: AppModalProps) {
  if (!open) return null;

  const maxWidth =
    width === "sm"
      ? "max-w-md"
      : width === "lg"
      ? "max-w-3xl"
      : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="app-modal-title"
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in duration-150`}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <h2
            id="app-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
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
