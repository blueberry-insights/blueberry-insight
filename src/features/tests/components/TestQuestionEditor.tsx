"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TestQuestion } from "@/core/models/Test";
import { useToast } from "@/shared/hooks/useToast";
import {
  updateQuestionAction,
  deleteQuestionAction,
} from "@/app/(app)/tests/[id]/action";
import { TestQuestionRow } from "./table/TestQuestionRow";

type Props = {
  testId: string;
  testOrgId: string;
  questions: TestQuestion[];
  onDeleteLocal: (id: string) => void;
};

export function TestQuestionsEditor({ testId, testOrgId, questions, onDeleteLocal }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [localQuestions, setLocalQuestions] = useState<TestQuestion[]>(questions);

  useEffect(() => {
    const incomingIds = questions.map((q) => q.id).join("|");
    const localIds = localQuestions.map((q) => q.id).join("|");

    if (incomingIds !== localIds) {
      setLocalQuestions(questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  async function onUpdate(questionId: string, patch: Partial<TestQuestion>) {
    const snapshot = localQuestions;
    // optimistic
    setLocalQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q))
    );

    const target = snapshot.find((q) => q.id === questionId);
    if (!target) return;

    const fd = new FormData();
    fd.set("orgId", testOrgId);
    fd.set("testId", testId);
    fd.set("questionId", questionId);

    // garde dimension si pas touchée
    fd.set("dimensionCode", String(patch.dimensionCode ?? target.dimensionCode ?? ""));
    fd.set("dimensionOrder", String(patch.dimensionOrder ?? target.dimensionOrder ?? ""));

    fd.set("label", String(patch.label ?? target.label ?? ""));
    fd.set("kind", String(patch.kind ?? target.kind ?? ""));
    fd.set("isReversed", String(patch.isReversed ?? target.isReversed ?? ""));

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
      setLocalQuestions(snapshot); 
      toast.error({
        title: "Erreur",
        description: res.error ?? "Erreur lors de la mise à jour",
      });
      return;
    }

    toast.success({
      title: "Question mise à jour",
      description: "Modifications enregistrées.",
    });

    // ✅ sync serveur (plus de refresh manuel)
    router.refresh();
  }

  async function onDelete(questionId: string, dimensionCode?: string | null) {
    const snapshot = localQuestions;

    setLocalQuestions((prev) => prev.filter((q) => q.id !== questionId));

    const fd = new FormData();
    fd.set("testId", testId);
    fd.set("orgId", testOrgId);
    fd.set("questionId", questionId);
    fd.set("dimensionCode", dimensionCode ?? "");
    const res = await deleteQuestionAction(fd);

    if (!res.ok) {
      setLocalQuestions(snapshot); // rollback
      toast.error({
        title: "Erreur",
        description: res.error ?? "Impossible de supprimer la question.",
      });
      return;
    }

    // ✅ only after success, notify parent (évite les effets “parent écrase”)
    onDeleteLocal?.(questionId);

    toast.success({
      title: "Question supprimée",
      description: "La question a été retirée du test.",
    });

    // ✅ sync serveur
    router.refresh();
  }

  const grouped = useMemo(() => {
    const getDimKey = (q: TestQuestion) => q.dimensionCode?.trim() || "D?";

    const map = new Map<
      string,
      { dimCode: string; dimOrder: number; items: TestQuestion[] }
    >();

    for (const q of localQuestions) {
      const dimCode = getDimKey(q);
      const dimOrder = q.dimensionOrder ?? 999;

      const entry = map.get(dimCode) ?? { dimCode, dimOrder, items: [] };
      entry.items.push(q);
      entry.dimOrder = Math.min(entry.dimOrder, dimOrder);

      map.set(dimCode, entry);
    }

    for (const g of map.values()) {
      g.items.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    }

    // ✅ tri des dimensions
    return [...map.values()].sort((a, b) => {
      if (a.dimOrder !== b.dimOrder) return a.dimOrder - b.dimOrder;
      return a.dimCode.localeCompare(b.dimCode);
    });
  }, [localQuestions]);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.dimCode} className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">{group.dimCode}</div>

          <div className="space-y-2">
            {group.items.map((q, index) => (
              <div
                key={q.id}
                className="flex items-start gap-3 border rounded-lg px-3 py-2"
              >
                <div className="flex-1">
                  <TestQuestionRow
                    index={index}
                    question={q}
                    onUpdate={onUpdate}
                    onDelete={() => onDelete(q.id, q.dimensionCode)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
