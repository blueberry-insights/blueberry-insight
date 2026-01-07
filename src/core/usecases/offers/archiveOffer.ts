
import { z } from "zod";
import type { OfferRepo } from "@/core/ports/OfferRepo";

const ArchiveOfferSchema = z.object({
  orgId: z.string().uuid(),
  offerId: z.string().uuid(),
});

export type ArchiveOfferInput = z.infer<typeof ArchiveOfferSchema>;

export function makeArchiveOffer(repo: OfferRepo) {
  return async (raw: unknown): Promise<void> => {
    const input = ArchiveOfferSchema.parse(raw);

    await repo.archiveById({
      orgId: input.orgId,
      offerId: input.offerId,
    });
  };
}
