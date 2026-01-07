// core/usecases/makeArchiveCandidate.ts
import { z } from "zod";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";

const ArchiveCandidateSchema = z.object({
  orgId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

export type ArchiveCandidateInput = z.infer<typeof ArchiveCandidateSchema>;

export function makeArchiveCandidate(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const input = ArchiveCandidateSchema.parse(raw);

    await repo.archiveById({
      orgId: input.orgId,
      candidateId: input.candidateId,
    });
  };
}
