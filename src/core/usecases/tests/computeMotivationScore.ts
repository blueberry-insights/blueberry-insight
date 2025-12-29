// core/usecases/computeMotivationScore.ts
import type { Test, TestQuestion, TestAnswer } from "@/core/models/Test";

export function computeMotivationScore(params: {
  test: Test;
  questions: TestQuestion[];
  answers: { questionId: string; valueText?: string | null; valueNumber?: number | null }[];
}): { numericScore: number | null; maxScore: number | null } {
  const { test, questions, answers } = params;

  if (test.type !== "motivations") {
    return { numericScore: null, maxScore: null };
  }
  
  const yesNoQuestions = questions.filter(q => q.kind === "yes_no");
  const maxScore = yesNoQuestions.length;
  
  if (!maxScore) return { numericScore: null, maxScore: null };
  
  const answerByQuestion = new Map(
    answers.map(a => [a.questionId, a])
  );
  
  const numericScore = yesNoQuestions.reduce((score, q) => {
    const ans = answerByQuestion.get(q.id);
    if (!ans?.valueText) return score;
  
    const v = ans.valueText.trim().toLowerCase();
    return (v === "yes" || v === "oui") ? score + 1 : score;
  }, 0);
  
  return { numericScore, maxScore };
  
}
