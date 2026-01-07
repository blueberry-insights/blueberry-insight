import { Test, TestQuestion } from "@/core/models/Test";
import { computeMotivationScore } from "./computeMotivationScore";
import { computeMotivationScoreByDimension } from "./computeMotivationByDimension";

export function computeMotivationScoring(params: {
    test: Test;
    questions: TestQuestion[];
    answers: { questionId: string; valueText?: string | null; valueNumber?: number | null }[];
  }) {
    if (params.test.type !== "motivations") {
      return { global: { numericScore: null, maxScore: null }, byDimension: [] };
    }
  
    const global = computeMotivationScore(params);
    const byDimension = computeMotivationScoreByDimension(params);
  
    return { global, byDimension };
  }
  