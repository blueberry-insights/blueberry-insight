"use client";

import { useTransition } from "react";
import type { Test } from "@/core/models/Test";
import { AppModal } from "@/shared/ui/AppModal";
import { useToast } from "@/shared/hooks/useToast";
import { deleteTestAction } from "@/app/(app)/tests/action";
import { GenericForm } from "@/shared/ui";

type Props = {
  open: boolean;
  test: Test | null;
  isSubmitting: boolean;
  onClose: () => void;
  onDeleted: (testId: string) => void;
};

export function DeleteTestModal({ open, test, isSubmitting, onClose, onDeleted }: Props) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  if (!open || !test) return null;
  const currentTest = test;
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = currentTest;

    startTransition(async () => {
      const form = new FormData();
      form.set("testId", t.id);

      const res = await deleteTestAction(form);

      if (!res || !("ok" in res) || !res.ok) {
        const msg =
          ("error" in res && typeof res.error === "string" ? res.error : null) ??
          "Ce test ne peut pas être supprimé (il est probablement utilisé dans un parcours).";

        toast.error({ title: "Suppression impossible", description: msg });
        return;
      }

      toast.success({
        title: "Test supprimé",
        description: `"${t.name}" a été supprimé.`,
      });

      onDeleted(t.id);
      onClose();
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Supprimer ce test ?"
      width="sm"
      isBusy={isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="delete-test-form"
            disabled={pending}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Suppression..." : "Supprimer"}
          </button>
        </>
      }
    >
      <GenericForm id="delete-test-form" onSubmit={handleSubmit} className="space-y-2">
        <p className="text-sm text-slate-600">
          Vous êtes sur le point de supprimer{" "}
          <span className="font-semibold">{test.name}</span>.
        </p>

        <p className="text-xs text-slate-500">
          Action définitive. Impossible si ce test est utilisé dans un parcours.
        </p>
      </GenericForm>
    </AppModal>
  );
}
