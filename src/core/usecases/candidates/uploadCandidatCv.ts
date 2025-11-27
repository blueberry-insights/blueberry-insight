import { z } from "zod";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";

export const AttachCandidateCvSchema = z.object({
  orgId: z.string().uuid(),
  candidateId: z.string().uuid(),
  cvPath: z.string().trim().min(1, "Chemin du CV manquant"),
  originalName: z.string().trim().min(1, "Nom du fichier manquant"),
  mimeType: z.string().trim().min(1, "Type MIME manquant"),
  sizeBytes: z.number().int().nonnegative("Taille du fichier invalide"),
  uploadedAt: z
    .string()
    .datetime()
    .optional(),
});

export type AttachCandidateCvInput = z.infer<typeof AttachCandidateCvSchema>;

export function makeAttachCandidateCv(repo: CandidateRepo) {
  return async (raw: unknown) => {
    const parsed = AttachCandidateCvSchema.parse(raw);

    const input = {
      orgId: parsed.orgId,
      candidateId: parsed.candidateId,
      cvPath: parsed.cvPath,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.sizeBytes,
      uploadedAt: parsed.uploadedAt ?? new Date().toISOString(),
    };

    return repo.attachCv(input);
  };
}
