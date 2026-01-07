// app/(public)/candidate/test/[token]/CandidateTestClient.tsx
"use client";

import { useMemo, useState } from "react";
import type { Test, TestQuestion, TestSubmission } from "@/core/models/Test";
import {
  groupQuestionsByDimension,
  shouldGroupByDimension,
} from "@/shared/utils/groupQuestionsByDimension";

type Props = {
  token: string;
  test?: Test | null;
  submission?: TestSubmission | null;
  questions?: TestQuestion[] | null;
  completedMessage?: string | null;
};

type AnswerState = {
  [questionId: string]: {
    valueText?: string;
    valueNumber?: number;
  };
};

export default function CandidateTestClient({
  token,
  test,
  submission,
  questions,
  completedMessage,
}: Props) {
  const safeQuestions = useMemo(() => questions ?? [], [questions]);

  // ✅ Important : "déjà complété" peut être vrai même si test/submission ne sont pas envoyés
  const isAlreadyCompleted =
    Boolean(submission?.completedAt) || Boolean(completedMessage);

  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ si déjà complété dès l'arrivée, on n'a pas besoin de test.name etc.
  const [submitted, setSubmitted] = useState(isAlreadyCompleted);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), valueText: value },
    }));
  };

  const handleNumberChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), valueNumber: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!submission?.id) {
      setError("Impossible d’envoyer : submission introuvable.");
      return;
    }

    const payloadAnswers = safeQuestions
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
          submissionId: submission.id,
          answers: payloadAnswers,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const apiMsg =
          json?.error ??
          (res.status === 400
            ? "Ce test a déjà été soumis."
            : "Erreur lors de l’envoi de vos réponses.");
        setError(apiMsg);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Erreur réseau. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Écran "déjà soumis" (persist après refresh)
  if (submitted || isAlreadyCompleted) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">
          Merci, votre test a bien été envoyé ✅
        </h1>
        <p className="text-sm text-slate-600">
          {completedMessage ??
            "Vos réponses ont été transmises au recruteur. Vous pouvez fermer cette page."}
        </p>
      </div>
    );
  }

  // ✅ ici seulement on exige le payload complet
  if (!test || !submission || !safeQuestions.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Lien invalide ou expiré</h1>
        <p className="text-sm text-slate-600">
          Ce test n’est plus accessible (déjà soumis, expiré, ou lien invalide).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow p-6 space-y-6"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{test.name}</h1>
        {test.description && (
          <p className="text-sm text-slate-600">{test.description}</p>
        )}
      </header>
      <div className="space-y-6">
        {shouldGroupByDimension(safeQuestions)
          ? groupQuestionsByDimension(safeQuestions).map((dimension) => (
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
                          </p>
                        </div>
                      </div>

                      <div className="pl-6">
                        {renderQuestionInput(q, answers[q.id], {
                          onTextChange: (value) =>
                            handleTextChange(q.id, value),
                          onNumberChange: (value) =>
                            handleNumberChange(q.id, value),
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : safeQuestions.map((q, index) => (
              <div
                key={q.id}
                className="border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-slate-500">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-medium">
                      {q.label}
                      {q.businessCode ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          {q.businessCode}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {renderKindLabel(q.kind)}
                      {q.isRequired && " • Obligatoire"}
                    </p>
                  </div>
                </div>

                <div className="pl-6">
                  {renderQuestionInput(q, answers[q.id], {
                    onTextChange: (value) => handleTextChange(q.id, value),
                    onNumberChange: (value) => handleNumberChange(q.id, value),
                  })}
                </div>
              </div>
            ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-900 text-white bg-slate-900 text-sm font-medium disabled:opacity-60 w-full"
      >
        {submitting ? "Envoi en cours..." : "Envoyer mes réponses"}
      </button>
    </form>
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
  }
) {
  const commonInputClass =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm";

  switch (q.kind) {
    case "yes_no": {
      const value = current?.valueText ?? "";
      return (
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
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
      const options = q.options ?? [];
      const value = current?.valueText ?? "";
      return (
        <select
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
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => handlers.onNumberChange(Number(e.target.value))}
            className="w-full"
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
          className={commonInputClass + " min-h-[120px] resize-y"}
          value={value}
          onChange={(e) => handlers.onTextChange(e.target.value)}
        />
      );
    }
  }
}
