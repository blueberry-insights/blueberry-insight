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

  if (test.type !== "motivations") {
    return {
      numericScore: null,
      maxScore: null,
      scoringResult: null,
    };
  }

  const answerByQuestion = new Map(
    answers.map((a) => [a.questionId, a])
  );

  // --- 1) Questions Likert scorées ---
  const scoredQuestions = questions.filter(
    (q) => q.kind === "scale" && q.dimensionCode
  );

  const byDimension = new Map<
    string,
    { values: number[] }
  >();

  for (const q of scoredQuestions) {
    const ans = answerByQuestion.get(q.id);
    if (!ans || ans.valueNumber == null) continue;

    let value = ans.valueNumber;

    // Reverse scoring
    if (q.isReversed) {
      value = 6 - value;
    }

    const dim = q.dimensionCode!;
    if (!byDimension.has(dim)) {
      byDimension.set(dim, { values: [] });
    }

    byDimension.get(dim)!.values.push(value);
  }

  if (byDimension.size === 0) {
    return {
      numericScore: null,
      maxScore: null,
      scoringResult: null,
    };
  }

  // --- 2) Score par dimension ---
  const dimensionScores: DimensionScore[] = [];

  for (const [dimensionCode, data] of byDimension.entries()) {
    const avg =
      data.values.reduce((a, b) => a + b, 0) / data.values.length;

    dimensionScores.push({
      dimensionCode,
      average: round(avg),
      level: motivationLevel(avg),
    });
  }

  // --- 3) Score global = moyenne des dimensions ---
  const globalAverage =
    dimensionScores.reduce((sum, d) => sum + d.average, 0) /
    dimensionScores.length;

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

  return {
    numericScore,
    maxScore: 5,
    scoringResult,
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function motivationLevel(score: number): string {
  if (score < 2) return "very_low";
  if (score < 3) return "low";
  if (score < 4) return "moderate";
  if (score < 4.5) return "high";
  return "very_high";
}
