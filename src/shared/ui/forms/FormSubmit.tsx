"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type FormSubmitProps = {
  children?: ReactNode;
  className?: string;
  form?: string;           
  pendingOverride?: boolean;  
};

export function FormSubmit({
  children,
  className,
  form,
  pendingOverride,
}: FormSubmitProps) {
  const { pending: pendingFromForm } = useFormStatus();

  const pending = pendingOverride ?? pendingFromForm;
  const label = children ?? "Valider";

  return (
    <button
      type="submit"
      form={form}   
      disabled={pending}
      className={`relative w-full rounded-lg bg-[#8B97FF] text-sm text-white py-2 font-medium transition-all
        ${pending ? "opacity-70 cursor-wait" : "hover:opacity-90"}
        ${className ?? ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Traitement...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
