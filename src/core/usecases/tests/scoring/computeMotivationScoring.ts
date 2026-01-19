// core/usecases/computeMotivationScoring.ts
import type { Test, TestQuestion, MotivationScoringResult } from "@/core/models/Test";

type AnswerInput = {
  questionId: string;
  valueNumber?: number | null;
  valueText?: string | null;
};

type DimensionScore = {
  dimensionCode: string;
  average: number;
  level: string;
};

export function computeMotivationScoring(params: {
  test: Test;
  questions: TestQuestion[];
  answers: AnswerInput[];
}): {
  numericScore: number | null;
  maxScore: number | null;
  scoringResult: MotivationScoringResult | null;
} {
  const { test, questions, answers } = params;

  // On ne score que les tests motivations
  if (test.type !== "motivations") {
    return { numericScore: null, maxScore: null, scoringResult: null };
  }

  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  // --- 1) Questions scorées : scale + dimensionCode ---
  const scoredQuestions = questions.filter(
    (q) => q.kind === "scale" && Boolean(q.dimensionCode)
  );

  // Dimension -> valeurs normalisées (dans le sens "plus haut = plus positif")
  const byDimension = new Map<string, { values: number[] }>();

  // On calcule aussi un max global cohérent (si toutes les questions sont sur la même échelle -> propre)
  // Sinon on retombe sur 5 (comportement actuel) pour ne pas faire de surprise.
  let globalMin: number | null = null;
  let globalMax: number | null = null;

  for (const q of scoredQuestions) {
    const ans = answerByQuestion.get(q.id);
    if (!ans || ans.valueNumber == null) continue;

    // défauts sûrs (comportement actuel)
    const min = q.minValue ?? 1;
    const max = q.maxValue ?? 5;

    // sécurité : échelle invalide => on ignore la question (plutôt que bug silencieux)
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) continue;

    let value = ans.valueNumber;

    // sécurité : si l'user envoie une valeur hors bornes, on clamp (évite les scores débiles)
    value = clamp(value, min, max);

    // Reverse scoring (universel) : min + max - value
    if (q.isReversed) {
      value = min + max - value;
    }

    const dim = q.dimensionCode!;
    if (!byDimension.has(dim)) byDimension.set(dim, { values: [] });
    byDimension.get(dim)!.values.push(value);

    // Track échelle globale (si toutes identiques)
    if (globalMin == null) globalMin = min;
    if (globalMax == null) globalMax = max;

    if (globalMin !== min) globalMin = NaN;
    if (globalMax !== max) globalMax = NaN;
  }

  if (byDimension.size === 0) {
    return { numericScore: null, maxScore: null, scoringResult: null };
  }

  // --- 2) Score par dimension ---
  const dimensionScores: DimensionScore[] = [];
  for (const [dimensionCode, data] of byDimension.entries()) {
    const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;

    dimensionScores.push({
      dimensionCode,
      average: round(avg),
      level: motivationLevel(avg),
    });
  }

  // --- 3) Score global = moyenne des dimensions ---
  const globalAverage =
    dimensionScores.reduce((sum, d) => sum + d.average, 0) / dimensionScores.length;

  const numericScore = round(globalAverage);

  // --- 4) scoring_result v2.5 ---
  const scoringResult = {
    version: "v2.5",
    global: {
      average: numericScore,
      level: motivationLevel(numericScore),
    },
    dimensions: dimensionScores,
  };

  // maxScore :
  // - si toutes les questions sont sur la même échelle => max = globalMax
  // - sinon on garde 5 pour ne pas casser l’affichage existant (et tu pourras améliorer après la démo)
  const maxScore =
    globalMax != null && Number.isFinite(globalMax) ? (globalMax as number) : 5;

  return {
    numericScore,
    maxScore,
    scoringResult: scoringResult as MotivationScoringResult,
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function motivationLevel(score: number): string {

  if (score < 2) return "very_low";
  if (score < 3) return "low";
  if (score < 3.5) return "moderate_low";
  if (score <= 4.0) return "moderate_high";
  return "high";
}

