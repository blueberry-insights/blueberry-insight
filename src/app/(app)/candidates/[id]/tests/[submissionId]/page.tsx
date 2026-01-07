// src/app/(app)/candidates/[id]/tests/[submissionId]/page.tsx
import { notFound } from "next/navigation";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { supabaseServerRSC } from "@/infra/supabase/client";

import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";

import { CandidateTestSubmissionScreen } from "@/features/candidates/components/screens/CandidateTestSubmissionScreen";

type Props = {
  params: Promise<{ id: string; submissionId: string }>;
};

export default async function CandidateTestSubmissionPage({ params }: Props) {
  const { id: candidateId, submissionId } = await params;

  const { orgId } = await requireUserAndOrgForPage(
    "/candidates/[id]/tests/[submissionId]"
  );

  const sb = await supabaseServerRSC();
  const candidateRepo = makeCandidateRepo(sb);
  const testRepo = makeTestRepo(sb);

  const [candidate, payload, review] = await Promise.all([
    candidateRepo.getById(orgId, candidateId),
    testRepo.getSubmissionWithAnswers({ orgId, submissionId }),
    testRepo.getReviewBySubmissionId({submissionId }),
  ]);

  if (!candidate) notFound();
  if (!payload?.submission) notFound();

  // 🔒 garde-fou : la submission doit appartenir au candidat
  if (payload.submission.candidateId !== candidateId) notFound();

  return (
    <CandidateTestSubmissionScreen
      candidate={candidate}
      submission={payload.submission}
      test={payload.test}
      questions={payload.questions}
      answers={payload.answers}
      review={review ?? null} // ✅ NEW
    />
  );
}
