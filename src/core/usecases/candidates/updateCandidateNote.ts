import { z } from "zod";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";

export const UpdateCandidateNoteSchema = z.object({
  orgId: z.string().uuid(),
  candidateId: z.string().uuid(),
  note: z
    .string()
    .trim()
    .max(2000, "La note est trop longue")
    .optional()
    .nullable(),
});

export type UpdateCandidateNoteInput = z.infer<typeof UpdateCandidateNoteSchema>;

export function makeUpdateCandidateNote(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const parsed = UpdateCandidateNoteSchema.parse(raw);

    return repo.updateNote({
      orgId: parsed.orgId,
      candidateId: parsed.candidateId,
      note: parsed.note ?? null,
    });
  };
}

