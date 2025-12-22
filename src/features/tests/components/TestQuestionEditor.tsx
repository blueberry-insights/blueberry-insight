"use client";

import * as React from "react";
import type { TestQuestion } from "@/core/models/Test";
import { useToast } from "@/shared/hooks/useToast";
import {
  updateQuestionAction,
  deleteQuestionAction,
  reorderQuestionsAction,
} from "@/app/(app)/tests/[id]/action";
import { TestQuestionRow } from "./table/TestQuestionRow";
import { QuestionsSortableList } from "./table/QuestionSortableList";
import { GripVertical } from "lucide-react";

type Props = {
  testId: string;
  questions: TestQuestion[];
};

export function TestQuestionsEditor({ testId, questions }: Props) {
  const { toast } = useToast();
  const [localQuestions, setLocalQuestions] =
    React.useState<TestQuestion[]>(questions);

  React.useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  // IMPORTANT: snapshot stable pour rollback dans async
  const snapshotRef = React.useRef<TestQuestion[]>(questions);
  React.useEffect(() => {
    snapshotRef.current = localQuestions;
  }, [localQuestions]);

  async function onUpdate(questionId: string, patch: Partial<TestQuestion>) {
    const snapshot = snapshotRef.current;

    // optimistic
    setLocalQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q))
    );

    const target = snapshot.find((q) => q.id === questionId);
    if (!target) return;

    const fd = new FormData();
    fd.set("testId", testId);
    fd.set("questionId", questionId);
    fd.set("label", String(patch.label ?? target.label));
    fd.set("kind", String(patch.kind ?? target.kind));

    const kind = patch.kind ?? target.kind;

    if (kind === "scale") {
      const min = patch.minValue ?? target.minValue;
      const max = patch.maxValue ?? target.maxValue;
      fd.set("minValue", min == null ? "" : String(min));
      fd.set("maxValue", max == null ? "" : String(max));
    } else {
      fd.set("minValue", "");
      fd.set("maxValue", "");
    }

    if (kind === "choice") {
      const opts = (patch.options ?? target.options ?? []).join("\n");
      fd.set("options", opts);
    } else {
      fd.set("options", "");
    }

    const res = await updateQuestionAction(fd);
    if (!res.ok) {
      setLocalQuestions(snapshot); // rollback
      const msg = res.error ?? "Erreur lors de la mise à jour";
      toast.error({ title: "Erreur", description: msg });
      return;
    }

    toast.success({
      title: "Question mise à jour",
      description: "Modifications enregistrées.",
    });
  }

  async function onDelete(questionId: string) {
    const snapshot = snapshotRef.current;

    // optimistic
    setLocalQuestions((prev) => prev.filter((q) => q.id !== questionId));

    const fd = new FormData();
    fd.set("testId", testId);
    fd.set("questionId", questionId);

    const res = await deleteQuestionAction(fd);
    if (!res.ok) {
      setLocalQuestions(snapshot); // rollback
      const msg = res.error ?? "Impossible de supprimer la question.";
      toast.error({ title: "Erreur", description: msg });
      return;
    }

    toast.success({
      title: "Question supprimée",
      description: "La question a été retirée du test.",
    });
  }

  // tu peux garder ce tri si tu veux, mais du coup il faut que reorder mette à jour orderIndex
  const sorted = React.useMemo(
    () => [...localQuestions].sort((a, b) => a.orderIndex - b.orderIndex),
    [localQuestions]
  );

  return (
    <div className="space-y-2">
      <QuestionsSortableList
        items={sorted}
        onReorderLocal={setLocalQuestions}
        onReorderPersist={async (next) => {
          const fd = new FormData();
          fd.set("testId", testId);
          fd.set(
            "order",
            JSON.stringify(
              next.map((q, idx) => ({ questionId: q.id, orderIndex: idx + 1 }))
            )
          );
          const res = await reorderQuestionsAction(fd);
          if (!res.ok) throw new Error(res.error ?? "reorder failed");
        }}
        renderItem={(q, index, { dragHandleProps }) => (
          <div
            className="flex items-start gap-3 border rounded-lg px-3 py-2"
            key={q.id}
          >
            <button
              type="button"
              {...dragHandleProps}
              className="mt-1 cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
              aria-label="Réordonner la question"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <TestQuestionRow
                key={q.id}
                index={index}
                question={q}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
