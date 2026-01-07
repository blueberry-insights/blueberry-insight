"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import type { Test } from "@/core/models/Test";
import { updateTestAction } from "@/app/(app)/tests/action";
import { AppModal } from "@/shared/ui/AppModal";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import { useToast } from "@/shared/hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  test: Test | null;
  onUpdated: (t: Test) => void;
};

export function UpdateTestModal({ open, onClose, test, onUpdated }: Props) {
  // Initialiser les valeurs depuis le test quand il change
  const initialValues = useMemo(
    () => ({
      name: test?.name ?? "",
      description: test?.description ?? "",
    }),
    [test?.name, test?.description]
  );

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Utiliser une clé pour forcer la réinitialisation du composant quand le test change
  const modalKey = open && test ? `update-test-${test.id}` : "update-test-closed";

  // Réinitialiser les valeurs quand le test change (via useEffect avec condition pour éviter setState synchrone dans render)
  useEffect(() => {
    if (!open || !test) return;
    setValues(initialValues);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, test?.id]);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!test) return;

    if (!values.name.trim()) {
      setError("Le nom du test est obligatoire");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("testId", test.id);
      formData.set("name", values.name.trim());
      formData.set("description", values.description.trim());

      const res = await updateTestAction(formData);

      if (!res.ok) {
        const msg = res.error ?? "Erreur lors de la mise à jour du test";
        setError(msg);
        toast.error({
          title: "Erreur de mise à jour",
          description: msg,
        });
        return;
      }

      const updated = res.data as Test;

      toast.success({
        title: "Test mis à jour",
        description: `"${updated.name}" a été mis à jour.`,
      });

      onUpdated(updated);
      onClose();
    });
  }

  const testTypeLabel =
    test?.type === "motivations"
      ? "Test de motivations"
      : test?.type === "scenario"
      ? "Mise en situation"
      : test?.type ?? "—";

  return (
    <AppModal
      key={modalKey}
      open={open}
      onClose={onClose}
      title="Modifier le test"
      width="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <FormSubmit
            className="flex-1"
            form="update-test-form"
            pendingOverride={pending}
          >
            {pending ? "Enregistrement..." : "Enregistrer"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="update-test-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Infos principales */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Informations du test
          </p>

          <TextField
            name="name"
            label="Nom du test"
            placeholder="Ex : Test de motivations retail"
            value={values.name}
            onChange={(v) => set("name", v)}
          />

          {/* Type en lecture seule : on ne permet pas de changer le type après coup */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Type de test
            </label>
            <div className="h-9 flex items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-600">
              {testTypeLabel}
            </div>
            <p className="text-[10px] text-slate-400">
              Le type du test ne peut pas être modifié une fois créé.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Description (optionnel)
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
              placeholder="Ce que ce test mesure, pour quel usage…"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </GenericForm>
    </AppModal>
  );
}
