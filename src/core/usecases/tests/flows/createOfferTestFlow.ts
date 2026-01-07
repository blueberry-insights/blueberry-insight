import { z } from "zod";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  offerId: z.string().uuid(),
  name: z.string().min(1),
  createdBy: z.string().uuid(),
});

export function makeCreateOfferTestFlow(flowRepo: TestFlowRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);

    // Ici plus tard tu peux mettre des règles métier :
    // - limiter le nb de flows par offre
    // - vérifier que l’offre appartient bien à l’orga, etc.

    const flow = await flowRepo.createFlow({
      orgId: input.orgId,
      offerId: input.offerId,
      name: input.name,
      isActive: true,
      createdBy: input.createdBy,
    });

    return flow;
  };
}
