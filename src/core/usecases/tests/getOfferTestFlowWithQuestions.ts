import { z } from "zod";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";
import type { TestRepo } from "@/core/ports/TestRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  offerId: z.string().uuid(),
});

export function makeGetOfferTestFlowWithQuestions(
  flowRepo: TestFlowRepo,
  testRepo: TestRepo
) {
  return async (raw: unknown) => {
    const parsed = InputSchema.parse(raw);

    const data = await flowRepo.getFlowByOffer({
      orgId: parsed.orgId,
      offerId: parsed.offerId,
    });

    if (!data) return null;

    const items = await Promise.all(
      data.items.map(async (item) => {
        if (item.kind !== "test" || !item.testId) return item;

        const payload = await testRepo.getTestWithQuestions(
          item.testId,
          parsed.orgId
        );

        return {
          ...item,
          questions: payload?.questions ?? [],
        };
      })
    );

    return { flow: data.flow, items };
  };
}
