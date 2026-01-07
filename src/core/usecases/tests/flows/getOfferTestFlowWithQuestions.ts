import { TestFlowItem } from "@/core/models/TestFlow";
import { TestFlowRepo } from "@/core/ports/TestFlowRepo";
import { TestRepo } from "@/core/ports/TestRepo";
import z from "zod";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  offerId: z.string().uuid(),
});

export function makeGetOfferTestFlowWithQuestions(flowRepo: TestFlowRepo, testRepo: TestRepo) {
  return async (raw: unknown) => {
    const parsed = InputSchema.parse(raw);

    const data = await flowRepo.getFlowByOffer({
      orgId: parsed.orgId,
      offerId: parsed.offerId,
    });

    if (!data) return null;

    const items = await Promise.all(
      data.items.map(async (item: TestFlowItem) => {
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
