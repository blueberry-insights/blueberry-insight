import { z } from "zod";
import type { CandidateRepo, CreateCandidateInput } from "@/core/ports/CandidateRepo";

export const CandidateSchema = z.object({
  orgId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  skills: z.array(z.string()).default([]),
  offerId: z.string().uuid().optional().nullable(),
  cvUrl: z.string().url().optional().nullable(),
  createdBy: z.string().uuid(),
});
export type CandidateInput = z.infer<typeof CandidateSchema>;

export function makeCreateCandidate(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const input: CreateCandidateInput = CandidateSchema.parse(raw);
    return repo.insertCandidate(input);
  };
}
