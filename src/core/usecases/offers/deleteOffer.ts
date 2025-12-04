// src/core/usecases/offers/deleteOffer.ts
import type { OfferRepo } from "@/core/ports/OfferRepo";

export type DeleteOfferInput = {
  orgId: string;
  offerId: string;
};

export function makeDeleteOffer(repo: OfferRepo) {
  return async (input: DeleteOfferInput): Promise<void> => {
    await repo.deleteById({
      orgId: input.orgId,
      offerId: input.offerId,
    });
  };
}
