"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CandidateListItem } from "@/core/models/Candidate";
import type {
  Test,
  TestAnswer,
  TestQuestion,
  TestSubmission,
  TestReview, // ✅ ajoute ce type (ou adapte l'import)
} from "@/core/models/Test";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/shared/ui/AppModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { toast } from "@/shared/hooks/useToast";
import { addTestReviewAction } from "@/app/(app)/candidates/[id]/tests/[submissionId]/action";

type Props = {
  candidate: CandidateListItem;
  submission: TestSubmission;
  test: Test;
  questions: TestQuestion[];
  answers: TestAnswer[];
  review?: TestReview | null; // ✅ NEW
};

type AxisCommentVM = { axis: string; comment: string };

export function CandidateTestSubmissionScreen({
  candidate,
  submission,
  test,
  questions,
  answers,
  review = null,
}: Props) {
  const router = useRouter();

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, TestAnswer>();
    for (const a of answers) map.set(a.questionId, a);
    return map;
  }, [answers]);

  const completedAtLabel = submission.completedAt
    ? new Date(submission.completedAt).toLocaleString("fr-FR")
    : null;

  const scoreLabel =
    typeof submission.numericScore === "number" &&
    typeof submission.maxScore === "number"
      ? `${submission.numericScore} / ${submission.maxScore}`
      : null;

  // ---- Review modal
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [overallComment, setOverallComment] = useState("");
  const [axisComments, setAxisComments] = useState<AxisCommentVM[]>([
    { axis: "Global", comment: "" },
  ]);

  const hasReview = Boolean(review?.id);

  function updateAxisComment(index: number, next: AxisCommentVM) {
    setAxisComments((prev) => prev.map((x, i) => (i === index ? next : x)));
  }

  function addAxisRow() {
    setAxisComments((prev) => [...prev, { axis: "", comment: "" }]);
  }

  function removeAxisRow(index: number) {
    setAxisComments((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmitReview() {
    startTransition(async () => {
      const cleanAxes = axisComments
        .map((x) => ({ axis: x.axis.trim(), comment: x.comment.trim() }))
        .filter((x) => x.axis && x.comment);

      const fd = new FormData();
      fd.set("submissionId", submission.id);
      fd.set("overallComment", overallComment.trim());
      fd.set("axisCommentsJson", JSON.stringify(cleanAxes));

      const res = await addTestReviewAction(fd);

      if (!res.ok) {
        toast.error({
          title: "Erreur",
          description: res.error ?? "Impossible d’ajouter la review.",
        });
        return;
      }

      toast.success({ title: "Review enregistrée", description: "OK." });

      setOpen(false);
      setOverallComment("");
      setAxisComments([{ axis: "Global", comment: "" }]);

      // ✅ Le point clé : on recharge la page server pour récupérer la review persistée
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 rounded-xl border bg-white px-5 py-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">
            Résultat du test — {test.name}
          </h1>
          <p className="text-sm text-slate-600">
            Candidat : <span className="font-medium">{candidate.fullName}</span>
          </p>
          <p className="text-xs text-slate-500">
            Submission : {submission.id}
            {completedAtLabel
              ? ` • complétée le ${completedAtLabel}`
              : " • non complétée"}
            {scoreLabel ? ` • score ${scoreLabel}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="text-sm">
            <a href={`/candidates/${candidate.id}`}>Retour fiche candidat</a>
          </Button>

          <Button
            className="text-sm"
            onClick={() => setOpen(true)}
            disabled={hasReview} // ✅ MVP : une seule review
            title={hasReview ? "Une review existe déjà" : undefined}
          >
            Ajouter une review
          </Button>
        </div>
      </header>

      {/* ✅ Review affichée si existante */}
      {review ? (
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Review</h2>
            <span className="text-xs text-slate-500">
              {review.createdAt
                ? new Date(review.createdAt).toLocaleString("fr-FR")
                : ""}
            </span>
          </div>

          {review.overallComment ? (
            <p className="text-sm whitespace-pre-wrap text-slate-900">
              {review.overallComment}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pas de commentaire global.
            </p>
          )}

          {Array.isArray(review.axisComments) && review.axisComments.length > 0 ? (
            <div className="space-y-2">
              {review.axisComments.map((x, i) => (
                <div key={i} className="rounded-md border bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700">{x.axis}</p>
                  <p className="text-sm text-slate-900">{x.comment}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Réponses</h2>

        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune question.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const a = answerByQuestionId.get(q.id);
              const displayed = formatAnswer(q, a);

              return (
                <div key={q.id} className="rounded-lg border bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {idx + 1}. {q.label}
                        {q.isRequired ? (
                          <span className="ml-2 text-[11px] text-rose-600">
                            Obligatoire
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {renderKindLabel(q.kind)}
                        {q.dimensionCode ? ` • ${q.dimensionCode}` : ""}
                        {q.businessCode ? ` • ${q.businessCode}` : ""}
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        a
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {a ? "Répondu" : "Non répondu"}
                    </span>
                  </div>

                  <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {displayed}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter une review"
        width="lg"
        isBusy={pending}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="button" onClick={onSubmitReview} disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Commentaire global</Label>
            <textarea
              className="w-full min-h-[110px] rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Résumé, points forts/faibles, impression globale…"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Commentaires par axe</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAxisRow}
                disabled={pending}
              >
                + Ajouter un axe
              </Button>
            </div>

            <div className="space-y-2">
              {axisComments.map((row, i) => (
                <div
                  key={i}
                  className="grid gap-2 md:grid-cols-[1fr,2fr,auto] items-start"
                >
                  <Input
                    className="h-9 text-sm"
                    value={row.axis}
                    onChange={(e) =>
                      updateAxisComment(i, { ...row, axis: e.target.value })
                    }
                    placeholder="Axe (ex: Communication)"
                    disabled={pending}
                  />
                  <Input
                    className="h-9 text-sm"
                    value={row.comment}
                    onChange={(e) =>
                      updateAxisComment(i, { ...row, comment: e.target.value })
                    }
                    placeholder="Commentaire"
                    disabled={pending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAxisRow(i)}
                    disabled={pending || axisComments.length <= 1}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    Suppr.
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Pour la démo : simple. Après, on pourra structurer par dimension
              automatiquement.
            </p>
          </div>
        </div>
      </AppModal>
    </div>
  );
}

function renderKindLabel(kind: TestQuestion["kind"]) {
  switch (kind) {
    case "yes_no":
      return "Oui / Non";
    case "choice":
      return "Choix multiple";
    case "scale":
      return "Échelle";
    case "long_text":
      return "Texte libre";
    default:
      return kind;
  }
}

function formatAnswer(q: TestQuestion, a: TestAnswer | undefined): string {
  if (!a) return "—";

  if (q.kind === "scale") {
    const n = a.valueNumber;
    if (typeof n === "number") return String(n);
    return "—";
  }

  const t = a.valueText;
  if (typeof t === "string" && t.trim()) return t.trim();

  return "—";
}
