// app/candidate/test/[token]/CandidateFlowClient.tsx
"use client";

import { useMemo, useState } from "react";
import type { TestFlow } from "@/core/models/TestFlow";
import type { TestQuestion } from "@/core/models/Test";
import type { FlowItemWithContent } from "@/core/usecases/tests";
import {
  groupQuestionsByDimension,
  shouldGroupByDimension,
} from "@/shared/utils/groupQuestionsByDimension";

type Props = {
  token: string;
  flow: TestFlow;
  items: FlowItemWithContent[];
  currentItemIndex: number;
};

type AnswerState = Record<
  string,
  {
    valueText?: string;
    valueNumber?: number;
  }
>;

type AnswersByItemId = Record<string, AnswerState>;
type SubmittedByItemId = Record<string, boolean>;

export default function CandidateFlowClient({
  token,
  flow,
  items,
  currentItemIndex,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(currentItemIndex);

  const [answersByItemId, setAnswersByItemId] = useState<AnswersByItemId>({});

  const [submittedByItemId, setSubmittedByItemId] = useState<SubmittedByItemId>(
    {}
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentItem = items[currentIndex];

  const answers: AnswerState = useMemo(() => {
    return answersByItemId[currentItem.id] ?? {};
  }, [answersByItemId, currentItem.id]);

  const isCurrentSubmitted = submittedByItemId[currentItem.id] ?? false;
  const isLast = currentIndex === items.length - 1;

  const setCurrentItemAnswers = (updater: (prev: AnswerState) => AnswerState) => {
    setAnswersByItemId((prev) => ({
      ...prev,
      [currentItem.id]: updater(prev[currentItem.id] ?? {}),
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    if (isCurrentSubmitted) return;
    setCurrentItemAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), valueText: value },
    }));
  };

  const handleNumberChange = (questionId: string, value: number) => {
    if (isCurrentSubmitted) return;
    setCurrentItemAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), valueNumber: value },
    }));
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      currentItem.kind !== "test" ||
      !currentItem.questions ||
      !currentItem.submission
    ) {
      return;
    }

    if (isCurrentSubmitted) {
      // déjà envoyé → pas de resubmit
      return;
    }

    const payloadAnswers = currentItem.questions
      .map((q) => {
        const a = answers[q.id] ?? {};
        return {
          questionId: q.id,
          valueText: a.valueText,
          valueNumber: a.valueNumber,
        };
      })
      .filter(
        (a) =>
          (a.valueText !== undefined && a.valueText !== "") ||
          a.valueNumber !== undefined
      );

    if (!payloadAnswers.length) {
      setError("Merci de répondre au moins à une question.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/candidate/test/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: currentItem.submission.id,
          answers: payloadAnswers,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erreur lors de l'envoi de vos réponses.");
        return;
      }

      // ✅ on marque CET item comme submitted
      setSubmittedByItemId((prev) => ({ ...prev, [currentItem.id]: true }));

      // ✅ Auto-advance si pas dernier
      if (!isLast) {
        setTimeout(() => handleNext(), 500);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCurrentItem = () => {
    if (currentItem.kind === "video") {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{currentItem.title || "Vidéo"}</h2>
          {currentItem.description && (
            <p className="text-sm text-slate-600">{currentItem.description}</p>
          )}
          {currentItem.videoUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900">
             {/* <iframe
                src={currentItem.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              /> */}
              VIDEO NON DISPONIBLE
            </div>
          )}
        </div>
      );
    }

    if (currentItem.kind === "test" && currentItem.questions && currentItem.submission) {
      if (isCurrentSubmitted && isLast) {
        return (
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <h1 className="text-xl font-semibold mb-2">
              Merci, votre parcours de test a bien été complété ✅
            </h1>
            <p className="text-sm text-slate-600">
              Vos réponses ont été transmises au recruteur. Vous pouvez fermer cette page.
            </p>
          </div>
        );
      }

      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold">
              {currentItem.title ?? "Test"}
            </h2>
            {currentItem.description && (
              <p className="text-sm text-slate-600">{currentItem.description}</p>
            )}
            {currentItem.test?.description && (
              <p className="text-sm text-slate-600">{currentItem.test.description}</p>
            )}
          </header>

          <div className="space-y-6">
            {shouldGroupByDimension(currentItem.questions) ? (
              groupQuestionsByDimension(currentItem.questions).map((dimension) => (
                <div
                  key={dimension.dimensionCode}
                  className="space-y-4 border border-slate-200 rounded-xl p-5 bg-slate-50"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {dimension.dimensionCode}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {dimension.questions.length} question
                      {dimension.questions.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {dimension.questions.map((q) => (
                      <div
                        key={q.id}
                        className="border border-slate-200 rounded-lg p-4 bg-white space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-slate-500">
                            {q.businessCode || "•"}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{q.label}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {renderKindLabel(q.kind)}
                              {q.isRequired && " • Obligatoire"}
                              {isCurrentSubmitted && " • Envoyé"}
                            </p>
                          </div>
                        </div>

                        <div className="pl-6">
                          {renderQuestionInput(q, answers[q.id], {
                            onTextChange: (v) => handleTextChange(q.id, v),
                            onNumberChange: (v) => handleNumberChange(q.id, v),
                            disabled: isCurrentSubmitted,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              currentItem.questions.map((q, index) => (
                <div
                  key={q.id}
                  className="border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-slate-500">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="font-medium">{q.label}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {renderKindLabel(q.kind)}
                        {q.isRequired && " • Obligatoire"}
                        {isCurrentSubmitted && " • Envoyé"}
                      </p>
                    </div>
                  </div>

                  <div className="pl-6">
                    {renderQuestionInput(q, answers[q.id], {
                      onTextChange: (v) => handleTextChange(q.id, v),
                      onNumberChange: (v) => handleNumberChange(q.id, v),
                      disabled: isCurrentSubmitted,
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isCurrentSubmitted}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-900 text-white bg-slate-900 text-sm font-medium disabled:opacity-60 w-full"
          >
            {submitting
              ? "Envoi en cours..."
              : isCurrentSubmitted
              ? "Réponses envoyées ✓"
              : "Envoyer mes réponses"}
          </button>
        </form>
      );
    }

    return null;
  };

  const canGoNext =
    currentItem.kind === "video" ||
    (currentItem.kind === "test" && isCurrentSubmitted);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-2xl font-semibold">{flow.name}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            Étape {currentIndex + 1} sur {items.length}
          </span>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex gap-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`h-2 flex-1 rounded ${
                index < currentIndex
                  ? "bg-green-500"
                  : index === currentIndex
                  ? "bg-blue-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={index === currentIndex ? "font-medium text-blue-600" : ""}
            >
              {item.kind === "video" ? "📹" : "📝"}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">{renderCurrentItem()}</div>

      <div className="flex justify-between gap-4 pt-4 border-t">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Précédent
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === items.length - 1 || !canGoNext}
          className="px-4 py-2 rounded-xl border border-slate-900 text-white bg-slate-900 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

function renderKindLabel(kind: TestQuestion["kind"]) {
  switch (kind) {
    case "yes_no":
      return "Réponse fermée (Oui / Non)";
    case "choice":
      return "Choix parmi plusieurs options";
    case "scale":
      return "Échelle";
    case "long_text":
      return "Réponse libre";
    default:
      return kind;
  }
}

function renderQuestionInput(
  q: TestQuestion,
  current: { valueText?: string; valueNumber?: number } | undefined,
  handlers: {
    onTextChange: (value: string) => void;
    onNumberChange: (value: number) => void;
    disabled?: boolean;
  }
) {
  const commonInputClass =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed";

  const disabled = !!handlers.disabled;

  switch (q.kind) {
    case "yes_no": {
      const value = current?.valueText ?? "";
      return (
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              disabled={disabled}
              type="radio"
              name={q.id}
              value="yes"
              checked={value === "yes"}
              onChange={() => handlers.onTextChange("yes")}
            />
            Oui
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              disabled={disabled}
              type="radio"
              name={q.id}
              value="no"
              checked={value === "no"}
              onChange={() => handlers.onTextChange("no")}
            />
            Non
          </label>
        </div>
      );
    }

    case "choice": {
      const options = (q.options ?? []) as string[];
      const value = current?.valueText ?? "";
      return (
        <select
          disabled={disabled}
          className={commonInputClass}
          value={value}
          onChange={(e) => handlers.onTextChange(e.target.value)}
        >
          <option value="">Sélectionner une réponse…</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case "scale": {
      const min = q.minValue ?? 1;
      const max = q.maxValue ?? 5;
      const value = current?.valueNumber ?? Math.floor((min + max) / 2);

      return (
        <div className="space-y-2">
          <input
            disabled={disabled}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => handlers.onNumberChange(Number(e.target.value))}
            className="w-full disabled:opacity-60"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{min}</span>
            <span className="font-medium">{value}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }

    case "long_text":
    default: {
      const value = current?.valueText ?? "";
      return (
        <textarea
          disabled={disabled}
          className={commonInputClass + " min-h-[120px] resize-y"}
          value={value}
          onChange={(e) => handlers.onTextChange(e.target.value)}
        />
      );
    }
  }
}
