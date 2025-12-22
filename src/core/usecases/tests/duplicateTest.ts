import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  testId: z.string().uuid(),
  createdBy: z.string().uuid(),
});

export function makeDuplicateTest(testRepo: TestRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);
    const { orgId, testId, createdBy } = input;

    // 1) Récupérer le test + questions
    const existing = await testRepo.getTestWithQuestions(testId, orgId);
    if (!existing) {
      throw new Error("Test introuvable");
    }

    const { test, questions } = existing;

    // 2) Créer le nouveau test
    const duplicated = await testRepo.createTest({
      orgId,
      name: `${test.name} (copie)`,
      type: test.type,
      description: test.description,
      createdBy,
      isActive: true,
    });

    // 3) Dupliquer les questions
    const sortedQuestions = [...questions].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );

    for (const q of sortedQuestions) {
      await testRepo.addQuestion({
        orgId,
        testId: duplicated.id,
        label: q.label,
        kind: q.kind,
        minValue: q.minValue ?? undefined,
        maxValue: q.maxValue ?? undefined,
        options: q.options ?? undefined,
        isRequired: q.isRequired,
        orderIndex: q.orderIndex,
      });
    }

    return duplicated;
  };
}
