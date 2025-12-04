import { z } from "zod";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";

const DeleteCandidateSchema = z.object({
  orgId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

export type DeleteCandidateInput = z.infer<typeof DeleteCandidateSchema>;

export function makeDeleteCandidate(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const input = DeleteCandidateSchema.parse(raw);

    await repo.deleteById({
      orgId: input.orgId,
      candidateId: input.candidateId,
    });
  };
}