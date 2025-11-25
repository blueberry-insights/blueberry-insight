import { z } from "zod";
import { candidateStatusValues } from "@/core/models/Candidate";
import type { CandidateRepo, CreateCandidateInput } from "@/core/ports/CandidateRepo";

export const CandidateSchema = z.object({
  orgId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .optional()
    .nullable(),
  status: z.enum(candidateStatusValues).optional(),
  source: z
    .string()
    .trim()
    .min(1, "La source doit contenir au moins 1 caractère")
    .max(120, "La source est trop longue")
    .optional()
    .nullable(),
  tags: z.array(z.string().trim()).default([]),
  note: z
    .string()
    .trim()
    .max(2000, "La note est trop longue")
    .optional()
    .nullable(),
  offerId: z.string().uuid().optional().nullable(), 
});


export type CandidateInput = z.infer<typeof CandidateSchema>;

export function makeCreateCandidate(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const parsed = CandidateSchema.parse(raw);

    const input: CreateCandidateInput = {
      orgId: parsed.orgId,
      fullName: parsed.fullName,
      email: parsed.email ?? null,
      status: parsed.status,
      source: parsed.source ?? null,
      tags: parsed.tags?.filter((tag) => tag.length > 0),
      note: parsed.note ?? null,
      offerId: parsed.offerId ?? null,
    };

    return repo.create(input);
  };
}
