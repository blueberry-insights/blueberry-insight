import { Test, TestQuestion } from "@/core/models/Test";

 export function computeMotivationScoreByDimension(params: {
    test: Test;
    questions: TestQuestion[];
    answers: { questionId: string; valueText?: string | null; valueNumber?: number | null }[];
  }): {
    total: { numericScore: number | null; maxScore: number | null };
    byDimension: Record<string, { numericScore: number; maxScore: number }>;
  } {
    const { test, questions, answers } = params;
  
    if (test.type !== "motivations") {
      return { total: { numericScore: null, maxScore: null }, byDimension: {} };
    }
  
    const yesNoQuestions = questions.filter((q) => q.kind === "yes_no");
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  
    const byDimension: Record<string, { numericScore: number; maxScore: number }> = {};
  
    for (const q of yesNoQuestions) {
      const dim = q.dimensionCode ?? "D1";
      if (!byDimension[dim]) byDimension[dim] = { numericScore: 0, maxScore: 0 };
  
      byDimension[dim].maxScore += 1;
  
      const ans = answerByQuestion.get(q.id);
      const v = ans?.valueText?.trim().toLowerCase();
      if (v === "yes" || v === "oui") byDimension[dim].numericScore += 1;
    }
  
    const maxScore = yesNoQuestions.length;
    if (!maxScore) return { total: { numericScore: null, maxScore: null }, byDimension };
  
    const numericScore = Object.values(byDimension).reduce((acc, d) => acc + d.numericScore, 0);
  
    return {
      total: { numericScore, maxScore },
      byDimension,
    };
  }
  