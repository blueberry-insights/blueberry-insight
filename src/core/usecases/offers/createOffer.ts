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
  city: z.string().trim().max(120, "Ville trop longue").optional().nullable(),
  country: z.string().trim().max(120, "Pays trop long").optional().nullable(),
  isRemote: z.boolean().optional().default(false),
  remotePolicy: z
    .enum(["full_remote", "hybrid", "on_site"])
    .optional()
    .nullable(),
  contractType: z
    .enum(["CDI", "CDD", "Freelance", "Stage", "Alternance"])
    .optional()
    .nullable(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  currency: z.string().trim().max(10).optional().nullable(),
  
  // Gestion des responsabilités
  createdBy: z.string().uuid(), // User qui a créé l'offre (obligatoire)
  responsibleUserId: z.string().uuid(), // User responsable de l'offre (obligatoire)
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
      city: parsed.city ?? null,
      country: parsed.country ?? null,
      isRemote: parsed.isRemote ?? false,
      remotePolicy: parsed.remotePolicy ?? null,
      contractType: parsed.contractType ?? null,
      salaryMin: parsed.salaryMin ?? null,
      salaryMax: parsed.salaryMax ?? null,
      currency: parsed.currency ?? "EUR",
      createdBy: parsed.createdBy,
      responsibleUserId: parsed.responsibleUserId,
    };

    return repo.create(input);
  };
}
