import { z } from "zod";
import { offerStatusValues } from "@/core/models/Offer";
import type { OfferRepo } from "@/core/ports/OfferRepo";

export const UpdateOfferSchema = z.object({
  orgId: z.string().uuid(),
  offerId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(120, "Le titre est trop long"),
  description: z
    .string()
    .trim()
    .max(5000, "La description est trop longue")
    .nullable()
    .optional(),
  status: z.enum(offerStatusValues).optional(),
  city: z.string().trim().max(120, "Ville trop longue").nullable().optional(),
  country: z.string().trim().max(120, "Pays trop long").nullable().optional(),
  isRemote: z.boolean().optional(),
  remotePolicy: z
    .enum(["full_remote", "hybrid", "on_site"])
    .nullable()
    .optional(),
  contractType: z
    .enum(["CDI", "CDD", "Freelance", "Stage", "Alternance"])
    .nullable()
    .optional(),
  salaryMin: z.number().int().positive().nullable().optional(),
  salaryMax: z.number().int().positive().nullable().optional(),
  currency: z.string().trim().max(10).nullable().optional(),
});

export type UpdateOfferInput = z.infer<typeof UpdateOfferSchema>;

export function makeUpdateOffer(repo: OfferRepo) {
  return async (raw: unknown) => {
    const parsed = UpdateOfferSchema.parse(raw);

    const input: UpdateOfferInput = {
      orgId: parsed.orgId,
      offerId: parsed.offerId,
      title: parsed.title,
      description: parsed.description ?? null,
      status: parsed.status,
      city: parsed.city ?? null,
      country: parsed.country ?? null,
      isRemote: parsed.isRemote,
      remotePolicy: parsed.remotePolicy ?? null,
      contractType: parsed.contractType ?? null,
      salaryMin: parsed.salaryMin ?? null,
      salaryMax: parsed.salaryMax ?? null,
      currency: parsed.currency ?? null,
    };

    return repo.update(input);
  };
}
