import { z } from "zod";
import type { TestReview } from "@/core/models/Test";

// Si ton repo est typé autrement, adapte juste l'interface ci-dessous.
export type CreateTestReviewInput = {
  orgId: string;
  submissionId: string;
  reviewerId: string;
  overallComment?: string | null;
  axisComments?: { axisCode: string; comment: string }[] | null;
};

export type TestRepoForReviews = {
  // Tu l'as déjà dans ton repo : async addReview(input): Promise<TestReview>
  addReview(input: CreateTestReviewInput): Promise<TestReview>;

  // Optionnel mais recommandé (si tu veux empêcher double review)
  // getReviewBySubmissionId?(input: { orgId: string; submissionId: string }): Promise<TestReview | null>;
};

const AxisCommentSchema = z.object({
  axisCode: z.string().trim().min(1, "axisCode manquant"),
  comment: z.string().trim().min(1, "Commentaire d'axe vide"),
});

const InputSchema = z.object({
  orgId: z.string().trim().min(1, "orgId manquant"),
  submissionId: z.string().trim().min(1, "submissionId manquant"),
  reviewerId: z.string().trim().min(1, "reviewerId manquant"),
  overallComment: z
    .string()
    .trim()
    .max(5000, "Commentaire trop long")
    .nullable()
    .optional(),
  axisComments: z.array(AxisCommentSchema).nullable().optional(),
});

export function makeAddTestReview(repo: TestRepoForReviews) {
  return async function addTestReview(raw: CreateTestReviewInput): Promise<TestReview> {
    const input = InputSchema.parse(raw);

    // Normalisation
    const overallComment =
      input.overallComment && input.overallComment.trim().length > 0
        ? input.overallComment.trim()
        : null;

    const axisComments =
      input.axisComments?.length
        ? input.axisComments.map((a) => ({
            axisCode: a.axisCode.trim(),
            comment: a.comment.trim(),
          }))
        : null;

    // Si tu veux empêcher 2 reviews par submission :
    // if (repo.getReviewBySubmissionId) {
    //   const existing = await repo.getReviewBySubmissionId({
    //     orgId: input.orgId,
    //     submissionId: input.submissionId,
    //   });
    //   if (existing) throw new Error("Une review existe déjà pour cette submission.");
    // }

    return repo.addReview({
      orgId: input.orgId,
      submissionId: input.submissionId,
      reviewerId: input.reviewerId,
      overallComment,
      axisComments,
    });
  };
}
