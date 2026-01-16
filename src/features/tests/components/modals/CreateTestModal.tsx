// src/features/tests/modals/CreateTestModal.tsx
"use client";

import { useState, useTransition } from "react";
import type { Test, TestType } from "@/core/models/Test";
import { createTestAction } from "@/app/(app)/tests/action";
import { AppModal } from "@/shared/ui/AppModal";
import { TextField, FormSubmit, GenericForm } from "@/shared/ui/forms";
import { useToast } from "@/shared/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TargetOrg = { id: string; name: string; slug: string };
type Props = {
  open: boolean;
  onClose: () => void;
  orgId: string;
  onCreated: (t: Test) => void;
  targetOrgs: TargetOrg[];
};

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: "motivations", label: "Test de motivations" },
  { value: "scenario", label: "Mise en situation" },
];

export function CreateTestModal({
  open,
  onClose,
  orgId,
  onCreated,
  targetOrgs,
}: Props) {
  const [values, setValues] = useState({
    name: "",
    type: "motivations" as TestType,
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [exposure, setExposure] = useState<"global" | "targeted">("global");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const { toast } = useToast();

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    if (error) setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Le nom du test est obligatoire");
      return;
    }
    if (exposure === "targeted" && selectedTargets.length === 0) {
      setError("Sélectionne au moins une organisation ou repasse en Global.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name.trim());
      formData.set("type", values.type);
      formData.set("description", values.description.trim());
      formData.set("exposure", exposure);
      for (const id of selectedTargets) formData.append("targetOrgIds", id);
      const res = await createTestAction(formData);
      if (!res.ok) {
        const msg = res.error ?? "Erreur lors de la création du test";
        setError(msg);
        toast.error({
          title: "Erreur de création",
          description: msg,
        });
        return;
      }
   
      const created = res.data as Test;
      toast.success({
        title: "Test créé",
        description: `"${created.name}" est prêt à être configuré.`,
      });

      onCreated(created);
      onClose();
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Nouveau test"
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
            form="create-test-form"
            pendingOverride={pending}
          >
            {pending ? "Création..." : "Créer le test"}
          </FormSubmit>
        </>
      }
    >
      <GenericForm
        id="create-test-form"
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Type de test
            </label>
            <Select
              value={values.type}
              onValueChange={(v: TestType) => set("type", v)}
            >
              <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                <SelectValue placeholder="Type de test" />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    Sélectionne au moins une organisation, sinon mets “Global”.
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
