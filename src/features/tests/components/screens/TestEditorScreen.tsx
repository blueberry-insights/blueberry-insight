"use client";

import { useState, useTransition } from "react";
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
import { createQuestionAction } from "@/app/(app)/tests/[id]/action";
import { useToast } from "@/shared/hooks/useToast";
import { TestQuestionsEditor } from "../TestQuestionEditor";

type Props = {
  test: Test;
  questions: TestQuestion[];
};

type QuestionKind = TestQuestion["kind"];

export function TestEditorScreen({ test, questions }: Props) {
  const [questionList, setQuestionList] = useState<TestQuestion[]>(() =>
    [...questions].sort((a, b) => a.orderIndex - b.orderIndex)
  );

  const isMotivations = test.type === "motivations";

  const [createForm, setCreateForm] = useState({
    label: "",
    kind: (isMotivations ? "yes_no" : "long_text") as QuestionKind,
    minValue: "",
    maxValue: "",
    options: "",
  });

  const [createPending, startCreateTransition] = useTransition();
  const { toast } = useToast();

  const nextOrderIndex = (questionList.at(-1)?.orderIndex ?? 0) + 1;

  function setCreate<K extends keyof typeof createForm>(
    key: K,
    value: (typeof createForm)[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { label, kind, minValue, maxValue, options } = createForm;

    if (!label.trim()) {
      toast.error({
        title: "Erreur",
        description: "Le libellé est obligatoire.",
      });
      return;
    }

    startCreateTransition(async () => {
      const form = new FormData();
      form.set("testId", test.id);
      form.set("label", label.trim());
      form.set("kind", kind);
      form.set("orderIndex", String(nextOrderIndex));

      if (kind === "scale") {
        if (minValue !== "") form.set("minValue", minValue);
        if (maxValue !== "") form.set("maxValue", maxValue);
      }

      if (kind === "choice") {
          form.set("options", options);
      }

      const res = await createQuestionAction(form);

      if (!res.ok) {
        toast.error({
          title: "Erreur de création",
          description:
            res.error ?? "Impossible de créer la question pour le moment.",
        });
        return;
      }

      const created = res.data as TestQuestion;

      setQuestionList((prev) =>
        [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex)
      );

      setCreateForm({
        label: "",
        kind: (isMotivations ? "yes_no" : "long_text") as QuestionKind,
        minValue: "",
        maxValue: "",
        options: "",
      });

      toast.success({
        title: "Question créée",
        description: `"${created.label}" a été ajoutée au questionnaire.`,
      });
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header test */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{test.name}</h1>
        <div className="text-xs text-muted-foreground">
          Type : {test.type === "motivations" ? "Motivations" : "Mise en situation"}
          {test.description && <> • {test.description}</>}
        </div>
      </div>

      {/* Formulaire d’ajout de question */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Ajouter une question</div>

        <GenericForm
          id="create-question-form"
          onSubmit={handleCreateSubmit}
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

          {/* Type de question */}
          <Select
            name="kind"
            value={createForm.kind}
            onValueChange={(value: QuestionKind) =>
              setCreate("kind", value)
            }
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
                name="minValue"
                type="number"
                placeholder="Min"
                value={createForm.minValue}
                onChange={(e) => setCreate("minValue", e.target.value)}
              />
              <Input
                name="maxValue"
                type="number"
                placeholder="Max"
                value={createForm.maxValue}
                onChange={(e) => setCreate("maxValue", e.target.value)}
              />
            </>
          ) : (
            <>
              {/* pour garder la grille alignée */}
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

          {/* Bouton submit */}
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" size="sm" disabled={createPending}>
              {createPending ? "Ajout..." : "Ajouter la question"}
            </Button>
          </div>
        </GenericForm>
      </Card>

      {/* Liste des questions existantes */}
      <Card className="p-4 space-y-2">
        <div className="font-medium mb-2">Questions du questionnaire</div>

        {questionList.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucune question pour le moment.
          </div>
        ) : (
          <div className="space-y-2">
           <TestQuestionsEditor testId={test.id} questions={questionList} />
          </div>
        )}
      </Card>
    </div>
  );
}
