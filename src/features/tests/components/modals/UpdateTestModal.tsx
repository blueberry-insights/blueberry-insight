"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import type { Test } from "@/core/models/Test";
import { updateTestAction, getTestTargetsAction } from "@/app/(app)/tests/action";
import { AppModal } from "@/shared/ui/AppModal";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import { useToast } from "@/shared/hooks/useToast";

type TargetOrg = { id: string; name: string; slug: string };

type Props = {
  open: boolean;
  onClose: () => void;
  test: Test | null;
  onUpdated: (t: Test) => void;
  targetOrgs: TargetOrg[];
};

export function UpdateTestModal({ open, onClose, test, onUpdated, targetOrgs }: Props) {
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
  const [exposure, setExposure] = useState<"global" | "targeted">("global");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const { toast } = useToast();

  // Récupérer les organisations cibles actuelles du test
  useEffect(() => {
    if (!open || !test) return;
    
    const fetchTargetOrgs = async () => {
      try {
        const formData = new FormData();
        formData.set("testId", test.id);
        const res = await getTestTargetsAction(formData);
        
        if (res.ok && res.data && res.data.length > 0) {
          setExposure("targeted");
          setSelectedTargets(res.data);
        } else {
          setExposure("global");
          setSelectedTargets([]);
        }
      } catch (err) {
        // En cas d'erreur, on assume global
        setExposure("global");
        setSelectedTargets([]);
      }
    };
    
    fetchTargetOrgs();
  }, [open, test?.id]);

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
      formData.set("id", test.id);
      formData.set("name", values.name.trim());
      formData.set("description", values.description.trim());
      formData.set("exposure", exposure);
      for (const id of selectedTargets) formData.append("targetOrgIds", id);

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
      console.log("[UpdateTestModal] submitting", {
        testId: test?.id,
        fd_testId: formData.get("testId"),
        exposure,
        selectedTargets,
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

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exposition
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExposure("global")}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  exposure === "global"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white/80 text-slate-700",
                ].join(" ")}
              >
                Global (toutes les organisations)
              </button>

              <button
                type="button"
                onClick={() => setExposure("targeted")}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  exposure === "targeted"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white/80 text-slate-700",
                ].join(" ")}
              >
                Ciblé (organisations sélectionnées)
              </button>
            </div>

            {exposure === "targeted" && (
              <div className="rounded-lg border border-slate-200 bg-white/60 p-3 space-y-2">
                <p className="text-xs text-slate-600">
                  Ce test sera visible uniquement pour les organisations
                  cochées.
                </p>

                <div className="max-h-48 overflow-auto space-y-2">
                  {targetOrgs.map((o) => {
                    const checked = selectedTargets.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedTargets((prev) =>
                              e.target.checked
                                ? [...prev, o.id]
                                : prev.filter((x) => x !== o.id)
                            );
                          }}
                        />
                        <span className="font-medium">{o.name}</span>
                        <span className="text-xs text-slate-500">
                          ({o.slug})
                        </span>
                      </label>
                    );
                  })}
                </div>

                {selectedTargets.length === 0 && (
                  <p className="text-xs text-red-600">
                    Sélectionne au moins une organisation, sinon mets &quot;Global&quot;.
                  </p>
                )}
              </div>
            )}
          </section>

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
