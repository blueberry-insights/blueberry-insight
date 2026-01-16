"use client";

import { useMemo, useState, useTransition } from "react";
import type { Test, TestQuestion } from "@/core/models/Test";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { GenericForm } from "@/shared/ui";
import {
  createQuestionAction,
  createDimensionAction,
  updateDimensionTitleAction,
} from "@/app/(app)/tests/[id]/action";
import { useToast } from "@/shared/hooks/useToast";
import { TestQuestionsEditor } from "../TestQuestionEditor";

type DimensionVM = {
  id: string;
  code: string; // "D1"
  title: string;
  orderIndex: number; // 1,2,3...
};

type Props = {
  test: Test;
  questions: TestQuestion[];
  dimensions: DimensionVM[];
};

type QuestionKind = TestQuestion["kind"];

export function TestEditorScreen({ test, questions, dimensions }: Props) {
  const { toast } = useToast();
  const [createPending, startCreateTransition] = useTransition();
  const [editingDimId, setEditingDimId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [renamePending, startRename] = useTransition();
  const [dimsLocal, setDimsLocal] = useState<DimensionVM[]>(dimensions);
  // questions locales uniquement pour l'affichage immédiat + tri
  const [questionList, setQuestionList] = useState<TestQuestion[]>(() =>
    [...questions].sort((a, b) => a.orderIndex - b.orderIndex)
  );

  const dimsSorted = useMemo(
    () => [...dimensions].sort((a, b) => a.orderIndex - b.orderIndex),
    [dimensions]
  );

  const isMotivations = test.type === "motivations";

  // -----------------------
  // Create Dimension
  // -----------------------
  const [dimensionTitle, setDimensionTitle] = useState("");

  async function handleCreateDimensionSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const title = dimensionTitle.trim();
    if (!title) {
      toast.error({
        title: "Erreur",
        description: "Le titre est obligatoire.",
      });
      return;
    }

    startCreateTransition(async () => {
      const fd = new FormData();
      fd.set("testId", test.id);
      fd.set("title", title);

      const res = await createDimensionAction(fd);

      if (!res.ok) {
        toast.error({
          title: "Erreur",
          description: res.error ?? "Impossible de créer la dimension.",
        });
        return;
      }

      setDimensionTitle("");
      toast.success({ title: "Dimension créée", description: "OK." });
      // le refresh des dims vient du revalidatePath côté server
    });
  }
  function startEditDimension(d: DimensionVM) {
    setEditingDimId(d.id);
    setEditingTitle(d.title);
  }

  function cancelEditDimension() {
    setEditingDimId(null);
    setEditingTitle("");
  }
  async function saveDimensionTitle() {
    if (!editingDimId) return;
    const title = editingTitle.trim();
    if (!title) {
      toast.error({
        title: "Erreur",
        description: "Le titre est obligatoire.",
      });
      return;
    }

    const snapshot = dimsLocal;

    // optimistic
    setDimsLocal((prev) =>
      prev.map((d) => (d.id === editingDimId ? { ...d, title } : d))
    );

    startRename(async () => {
      const fd = new FormData();
      fd.set("testId", test.id);
      fd.set("dimensionId", editingDimId);
      fd.set("title", title);

      const res = await updateDimensionTitleAction(fd);
      if (!res.ok) {
        setDimsLocal(snapshot); // rollback
        toast.error({
          title: "Erreur",
          description: res.error ?? "Impossible de renommer.",
        });
        return;
      }

      toast.success({ title: "Dimension renommée", description: "OK." });
      cancelEditDimension();
    });
  }

  // -----------------------
  // Create Question
  // -----------------------
  const defaultDim = dimsSorted[0];

  const [createForm, setCreateForm] = useState({
    label: "",
    kind: (isMotivations ? "yes_no" : "long_text") as QuestionKind,
    minValue: "",
    maxValue: "",
    options: "",
    dimensionCode: defaultDim?.code ?? "",
    dimensionOrder: defaultDim?.orderIndex ?? 1,
    isReversed: false,
  });

  function setCreate<K extends keyof typeof createForm>(
    key: K,
    value: (typeof createForm)[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  const nextOrderIndex = (questionList.at(-1)?.orderIndex ?? 0) + 1;

  async function handleCreateQuestionSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!dimsSorted.length) {
      toast.error({
        title: "Aucune dimension",
        description:
          "Crée d'abord une dimension (D1) avant d'ajouter une question.",
      });
      return;
    }

    const {
      label,
      kind,
      minValue,
      maxValue,
      options,
      dimensionCode,
      dimensionOrder,
      isReversed,
    } = createForm;

    if (!label.trim()) {
      toast.error({
        title: "Erreur",
        description: "Le libellé est obligatoire.",
      });
      return;
    }

    if (!dimensionCode) {
      toast.error({ title: "Erreur", description: "Choisis une dimension." });
      return;
    }

    startCreateTransition(async () => {
      const form = new FormData();
      form.set("orgId", test.orgId);
      form.set("testId", test.id);
      form.set("label", label.trim());
      form.set("kind", kind);
      form.set("orderIndex", String(nextOrderIndex));

      // dimensions
      form.set("dimensionCode", dimensionCode);
      form.set("dimensionOrder", String(dimensionOrder));

      if (kind === "scale") {
        if (minValue !== "") form.set("minValue", minValue);
        if (maxValue !== "") form.set("maxValue", maxValue);
        form.set("isReversed", String(createForm.isReversed));
      }

      if (kind === "choice") {
        form.set("options", options);
      }

      const res = await createQuestionAction(form);

      if (!res.ok) {
        toast.error({
          title: "Erreur de création",
          description: res.error ?? "Impossible de créer la question.",
        });
        return;
      }

      const created = res.data as TestQuestion;

      setQuestionList((prev) =>
        [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex)
      );

      setCreateForm((prev) => ({
        ...prev,
        label: "",
        kind: (isMotivations ? "yes_no" : "long_text") as QuestionKind,
        minValue: "",
        maxValue: "",
        options: "",
        // on garde la dimension sélectionnée
      }));

      toast.success({
        title: "Question créée",
        description: `"${created.label}" a été ajoutée.`,
      });
    });
  }

  const groups = useMemo(() => {
    const byCode = new Map<string, TestQuestion[]>();
    for (const q of questionList) {
      const code = q.dimensionCode ?? "D1";
      const arr = byCode.get(code) ?? [];
      arr.push(q);
      byCode.set(code, arr);
    }

    return dimsSorted.map((d) => ({
      dim: d,
      questions: (byCode.get(d.code) ?? []).sort(
        (a, b) => a.orderIndex - b.orderIndex
      ),
    }));
  }, [questionList, dimsSorted]);

  return (
    <div className="p-6 space-y-6">
      {/* Header test */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{test.name}</h1>
        <div className="text-xs text-muted-foreground">
          Type :{" "}
          {test.type === "motivations" ? "Motivations" : "Mise en situation"}
          {test.description && <> • {test.description}</>}
        </div>
      </div>

      {/* Dimensions */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Dimensions</div>

        {dimsSorted.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucune dimension. Crée D1 pour commencer.
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            {dimsSorted.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {d.code}
                </span>
                <div key={d.id} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.code}
                  </span>

                  {editingDimId === d.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-8 w-[260px]"
                        disabled={renamePending}
                      />
                      <Button
                        size="sm"
                        onClick={saveDimensionTitle}
                        disabled={renamePending || !editingTitle.trim()}
                      >
                        {renamePending ? "..." : "OK"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditDimension}
                        disabled={renamePending}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{d.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditDimension(d)}
                      >
                        Renommer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <GenericForm
          id="create-dimension-form"
          onSubmit={handleCreateDimensionSubmit}
          className="flex gap-2"
        >
          <Input
            name="title"
            placeholder="Titre (ex: Autonomie, Communication...)"
            value={dimensionTitle}
            onChange={(e) => setDimensionTitle(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            disabled={createPending || !dimensionTitle.trim()}
          >
            Ajouter
          </Button>
        </GenericForm>
      </Card>

      {/* Formulaire d’ajout de question */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Ajouter une question</div>

        {!dimsSorted.length ? (
          <div className="text-sm text-muted-foreground">
            Crée d’abord une dimension (D1) pour pouvoir ajouter des questions.
          </div>
        ) : (
          <GenericForm
            id="create-question-form"
            onSubmit={handleCreateQuestionSubmit}
            className="grid gap-2 md:grid-cols-[2fr,1fr,1fr,1fr]"
          >
            {/* Libellé */}
            <Input
              name="label"
              placeholder="Libellé de la question"
              required
              value={createForm.label}
              onChange={(e) => setCreate("label", e.target.value)}
            />

            {/* Dimension */}
            <Select
              value={createForm.dimensionCode}
              onValueChange={(value) => {
                const d = dimsSorted.find((x) => x.code === value);
                setCreate("dimensionCode", value);
                setCreate("dimensionOrder", d?.orderIndex ?? 1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dimension" />
              </SelectTrigger>
              <SelectContent>
                {dimsSorted.map((d) => (
                  <SelectItem key={d.id} value={d.code}>
                    {d.code} — {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type de question */}
            <Select
              name="kind"
              value={createForm.kind}
              onValueChange={(value: QuestionKind) => {
                setCreate("kind", value);
                if (value !== "scale") setCreate("isReversed", false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes_no">Oui / Non</SelectItem>
                <SelectItem value="scale">Échelle (min/max)</SelectItem>
                <SelectItem value="choice">Choix multiple</SelectItem>
                <SelectItem value="long_text">Texte libre</SelectItem>
              </SelectContent>
            </Select>

            {/* Échelle : min / max */}
            {createForm.kind === "scale" ? (
              <>
                <Input
                  type="number"
                  name="minValue"
                  value={createForm.minValue}
                  onChange={(e) => setCreate("minValue", e.target.value)}
                  placeholder="Min"
                  disabled={createPending}
                  className="h-9"
                />
                <Input
                  type="number"
                  name="maxValue"
                  value={createForm.maxValue}
                  onChange={(e) => setCreate("maxValue", e.target.value)}
                  placeholder="Max"
                  disabled={createPending}
                  className="h-9"
                />
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white/60 p-3 space-y-2">
                  <div className="text-sm font-medium text-slate-900">
                    Sens de l&apos;item
                  </div>

                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="create-scale-sense"
                    className="h-4 w-4 mt-0.5"
                    checked={!createForm.isReversed}
                    onChange={() => setCreate("isReversed", false)}
                    disabled={createPending}
                  />
                  <span>
                    <span className="font-medium">Normal</span> — Plus je suis
                    d’accord, plus c’est positif.
                    <span className="block text-[11px] text-slate-500">
                      Exemple : 5 = bon / 1 = mauvais
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="create-scale-sense"
                    className="h-4 w-4 mt-0.5"
                    checked={createForm.isReversed}
                    onChange={(e) => setCreate("isReversed", e.target.checked)}
                    disabled={createPending}
                  />
                  <span>
                    <span className="font-medium">Inversé</span> — Plus je suis
                    d’accord, plus c’est négatif (score inversé).
                    <span className="block text-[11px] text-slate-500">
                      Exemple : 5 = mauvais / 1 = bon
                    </span>
                  </span>
                </label>

                  <p className="text-[11px] text-slate-500">
                    Utilise &quot;Inversé&quot; pour les items formulés négativement (ex:
                    &quot;J&apos;attends qu&apos;on me dise quoi faire.&quot;).
                  </p>
                </div>
              </>
            ) : (
              <>
                <div />
                <div />
              </>
            )}

            {/* Choix multiple : options */}
            {createForm.kind === "choice" && (
              <div className="md:col-span-2">
                <textarea
                  name="options"
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder={`Options (une par ligne)\nex:\nGrande surface\nPME\nStartup`}
                  value={createForm.options}
                  onChange={(e) => setCreate("options", e.target.value)}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Utilisé uniquement pour les questions « Choix multiple ».
                </p>
              </div>
            )}

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" size="sm" disabled={createPending}>
                {createPending ? "Ajout..." : "Ajouter la question"}
              </Button>
            </div>
          </GenericForm>
        )}
      </Card>

      {/* Liste des questions existantes (groupées par dimension) */}
      <div className="space-y-4">
        {dimsSorted.length === 0
          ? null
          : groups.map(({ dim, questions }) => (
              <Card key={dim.id} className="p-4 space-y-2">
                <div className="font-medium">
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {dim.code}
                  </span>
                  {dim.title}
                </div>

                {questions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Aucune question.
                  </div>
                ) : (
                  <TestQuestionsEditor
                    testId={test.id}
                    testOrgId={test.orgId}
                    questions={questions}
                    onDeleteLocal={(id) =>
                      setQuestionList((prev) => prev.filter((q) => q.id !== id))
                    }
                  />
                )}
              </Card>
            ))}
      </div>
    </div>
  );
}
