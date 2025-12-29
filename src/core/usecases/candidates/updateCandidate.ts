import { z } from "zod";
import { candidateStatusValues } from "@/core/models/Candidate";
import type {
  CandidateRepo,
  UpdateCandidateInput,
} from "@/core/ports/CandidateRepo";

export const UpdateCandidateSchema = z.object({
  orgId: z.string().uuid(),
  candidateId: z.string().uuid(),
  fullName: z.string().trim().min(1, "Le nom complet est obligatoire"),
  email: z.email("Email invalide"),
  location: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  status: z.enum(candidateStatusValues).optional(),
  source: z.string().trim().nullable().optional(),
  tags: z
  .preprocess((val) => {
    if (val == null) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return [];
      return [trimmed];
    }
    return [];
  }, z.array(z.string().trim()))
  .default([]),
  note: z.string().trim().nullable().optional(),
  offerId: z.string().uuid().nullable().optional(),
});

export type UpdateInput = z.infer<typeof UpdateCandidateSchema>;

export function makeUpdateCandidate(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const parsed = UpdateCandidateSchema.parse(raw);

    const input: UpdateCandidateInput = {
      orgId: parsed.orgId,
      candidateId: parsed.candidateId,
      fullName: parsed.fullName,
      email: parsed.email ?? null,
      location: parsed.location ?? null,
      phone: parsed.phone ?? null,
      status: parsed.status,
      source: parsed.source ?? null,
      tags: parsed.tags,
      note: parsed.note ?? null,
      offerId: parsed.offerId ?? null,
    };
    return repo.update(input);
  };
}
