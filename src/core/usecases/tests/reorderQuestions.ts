import type { TestRepo } from "@/core/ports/TestRepo";

export function makeReorderQuestions(repo: TestRepo) {
  return async (input: { orgId: string; testId: string; order: { questionId: string; orderIndex: number }[] }) => {
    if (!input.testId) throw new Error("testId manquant");
    if (!input.orgId) throw new Error("orgId manquant");
    if (!input.order.length) return;

    await repo.reorderQuestions({ testId: input.testId, orgId: input.orgId, order: input.order });
  };
}
