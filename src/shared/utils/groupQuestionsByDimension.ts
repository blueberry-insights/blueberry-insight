// shared/utils/groupQuestionsByDimension.ts
import type { TestQuestion } from "@/core/models/Test";

export type DimensionGroup = {
  dimensionCode: string;
  dimensionOrder: number;
  questions: TestQuestion[];
};

/**
 * Groupe les questions par dimension (D1, D2, etc.)
 * et les trie par dimensionOrder puis par businessCode
 */
export function groupQuestionsByDimension(
  questions: TestQuestion[]
): DimensionGroup[] {
  // Grouper par dimensionCode
  const dimensionMap = new Map<string, TestQuestion[]>();

  for (const question of questions) {
    if (question.dimensionCode) {
      const key = question.dimensionCode;
      if (!dimensionMap.has(key)) {
        dimensionMap.set(key, []);
      }
      dimensionMap.get(key)!.push(question);
    }
  }

  // Convertir en array et trier
  const groups: DimensionGroup[] = Array.from(dimensionMap.entries()).map(
    ([dimensionCode, questions]) => {
      // Trier les questions par businessCode (D1.1, D1.2, etc.)
      const sortedQuestions = questions.sort((a, b) => {
        if (a.businessCode && b.businessCode) {
          return a.businessCode.localeCompare(b.businessCode);
        }
        if (a.businessCode) return -1;
        if (b.businessCode) return 1;
        // Si pas de businessCode, utiliser orderIndex
        return a.orderIndex - b.orderIndex;
      });

      // Récupérer le dimensionOrder (tous les questions d'une dimension ont le même)
      const dimensionOrder =
        sortedQuestions[0]?.dimensionOrder ?? Number.MAX_SAFE_INTEGER;

      return {
        dimensionCode,
        dimensionOrder,
        questions: sortedQuestions,
      };
    }
  );

  // Trier les groupes par dimensionOrder
  groups.sort((a, b) => a.dimensionOrder - b.dimensionOrder);

  return groups;
}

/**
 * Vérifie si les questions doivent être groupées par dimension
 * (si au moins une question a un dimensionCode)
 */
export function shouldGroupByDimension(questions: TestQuestion[]): boolean {
  return questions.some((q) => q.dimensionCode != null);
}

