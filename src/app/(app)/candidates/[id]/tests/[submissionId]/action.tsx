"use server";

import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeAddTestReview, TestRepoForReviews } from "@/core/usecases/tests/reviews/addTestReview";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export async function addTestReviewAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const submissionId = String(formData.get("submissionId") ?? "").trim();
    const overallComment =
      String(formData.get("overallComment") ?? "").trim() || null;

    if (!submissionId) {
      return { ok: false, error: "Submission introuvable" };
    }

    const repo = makeTestRepo(ctx.sb);
    const addReview = makeAddTestReview(repo as TestRepoForReviews);

    try {
      await addReview({
        orgId: ctx.orgId,
        submissionId,
        reviewerId: ctx.userId,
        overallComment,
      });

      return { ok: true };
    } catch (err) {
      console.error("[addTestReviewAction]", err);
      return { ok: false, error: "Erreur lors de l'enregistrement de la review" };
    }
  });
}
