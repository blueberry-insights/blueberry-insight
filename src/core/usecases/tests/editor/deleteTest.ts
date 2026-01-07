import type { TestRepo } from "@/core/ports/TestRepo";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";

type Input = {
  orgId: string;
  testId: string;
  role: string; // 'admin' | 'owner' | ...
};

export type DeleteTestResult =
  | { ok: true }
  | {
      ok: false;
      code: "FORBIDDEN" | "IN_USE" | "NOT_FOUND" | "UNKNOWN";
      message: string;
      meta?: { flowItemsCount: number };
    };

export function makeDeleteTest(testRepo: TestRepo, testFlowRepo: TestFlowRepo) {
  return async (input: Input): Promise<DeleteTestResult> => {
    const { orgId, testId, role } = input;

    // 1) Droits (back-office)
    if (!["admin", "owner"].includes(role)) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "Vous n'avez pas les droits pour supprimer un test.",
      };
    }

    // 2) Existence
    const existing = await testRepo.getTestById(testId, orgId);
    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "Test introuvable." };
    }

    // 3) Vérif usage dans les flows
    const flowItemsCount = await testFlowRepo.countItemsUsingTest(testId, orgId);
    if (flowItemsCount > 0) {
      return {
        ok: false,
        code: "IN_USE",
        message: `Impossible : ce test est utilisé dans ${flowItemsCount} étape(s) de parcours.`,
        meta: { flowItemsCount },
      };
    }

    // 4) Delete
    try {
      await testRepo.deleteTest({ testId, orgId });
      return { ok: true };
    } catch {
      return {
        ok: false,
        code: "UNKNOWN",
        message: "Erreur lors de la suppression du test.",
      };
    }
  };
}
