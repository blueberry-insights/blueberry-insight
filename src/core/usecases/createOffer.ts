import { z } from "zod";
import { offerStatusValues } from "@/core/models/Offer";
import type { OfferRepo, CreateOfferInput } from "@/core/ports/OfferRepo";

export const OfferSchema = z.object({
  orgId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(120, "Le titre est trop long"),
  description: z
    .string()
    .trim()
    .max(5000, "La description est trop longue")
    .optional()
    .nullable(),
  status: z.enum(offerStatusValues).optional(),
});
export type OfferInput = z.infer<typeof OfferSchema>;

export function makeCreateOffer(repo: OfferRepo) {
  return async (raw: unknown) => {
    const parsed = OfferSchema.parse(raw);

    const input: CreateOfferInput = {
      orgId: parsed.orgId,
      title: parsed.title,
      description: parsed.description ?? null,
      status: parsed.status,
    };

    return repo.create(input);
  };
}
