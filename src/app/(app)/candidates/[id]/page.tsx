// app/(app)/candidates/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { CandidateDetailScreen } from "@/features/candidates/components";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";
import { makeEnrichOffersWithUserNames } from "@/core/usecases/offers/enrichOffersWithUserNames";

import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import { makeListCandidateInvites } from "@/core/usecases/tests/invites/listCandidateInvites";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeGetTestFlowItemForOffer } from "@/core/usecases/tests/flows/getTestFlowItemForOffer";

import type { OfferListItem } from "@/core/models/Offer";
import type { TestFlowItemInfo } from "@/core/usecases/tests/flows/getTestFlowItemForOffer";
import type { TestSubmission, TestRef } from "@/core/models/Test";

type Props = {
  params: Promise<{ id: string }>;
};

type SubmissionScoreVM = {
  isScored: boolean;
  scoreLabel: string;
  ratio?: number;
  badge?: "Excellent" | "Bon" | "Moyen" | "Faible";
};

function mapSubmissionScore(sub: Pick<TestSubmission, "numericScore" | "maxScore">): SubmissionScoreVM {
  const { numericScore, maxScore } = sub;

  if (numericScore == null || maxScore == null || maxScore <= 0) {
    return { isScored: false, scoreLabel: "Test non scoré (mise en situation)" };
  }

  const ratio = numericScore / maxScore;

  let badge: SubmissionScoreVM["badge"] = "Faible";
  if (ratio >= 0.75) badge = "Excellent";
  else if (ratio >= 0.55) badge = "Bon";
  else if (ratio >= 0.35) badge = "Moyen";

  return {
    isScored: true,
    ratio,
    badge,
    scoreLabel: `${numericScore} / ${maxScore}`,
  };
}

function mergeTestsById<T extends { id: string }>(a: T[] = [], b: T[] = []) {
  const m = new Map<string, T>();
  for (const t of a) m.set(t.id, t);
  for (const t of b) m.set(t.id, t); // b override si besoin
  return Array.from(m.values());
}

export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;

  const { orgId } = await requireUserAndOrgForPage("/candidates/[id]");
  const sb = await supabaseServerRSC();

  const inviteRepo = makeTestInviteRepo(sb);
  const testRepo = makeTestRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);
  const offerRepo = makeOfferRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);

  // ✅ 1) Tests internes de l'orga
  const orgTests = await testRepo.listTestsByOrg(orgId); // <-- adapte le nom si chez toi c'est listByOrg / listByOrganization

 
  const catalogTests = await testRepo.listBlueberryCatalogTests(orgId);

  // ✅ 3) Merge + dedupe
  const tests: TestRef[] = mergeTestsById(orgTests ?? [], catalogTests ?? []);

  const listCandidateInvites = makeListCandidateInvites({ inviteRepo, testRepo });
  const invites = await listCandidateInvites({ orgId, candidateId: id });

  const candidate = await candidateRepo.getById(orgId, id);
  if (!candidate) notFound();

  const submissions = await testRepo.listSubmissionsByCandidate(id, orgId);

  const completedSubmissions = submissions.filter((s) => Boolean(s.completedAt));
  const latestCompletedSubmission =
    completedSubmissions.sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tb - ta;
    })[0] ?? null;

  const latestScoreVM = latestCompletedSubmission
    ? mapSubmissionScore({
        numericScore: latestCompletedSubmission.numericScore,
        maxScore: latestCompletedSubmission.maxScore,
      })
    : null;

  let offer = null;
  let offers: OfferListItem[] | null = null;
  const testFlowInfoMap: Record<string, TestFlowItemInfo> = {};

  if (candidate.offerId) {
    const rawOffers = await offerRepo.listByOrg(orgId);

    const userInfoRepo = makeUserInfoRepoForAction();
    const enrichOffers = makeEnrichOffersWithUserNames(userInfoRepo);
    offers = await enrichOffers(rawOffers);

    offer = offers.find((o) => o.id === candidate.offerId) ?? null;

    const getTestFlowItem = makeGetTestFlowItemForOffer({ flowRepo });

    const flowInfoPromises = tests.map(async (test) => {
      const flowInfo = await getTestFlowItem({
        orgId,
        offerId: candidate.offerId!,
        testId: test.id,
      });
      return { testId: test.id, flowInfo };
    });

    const flowInfoResults = await Promise.all(flowInfoPromises);

    flowInfoResults.forEach(({ testId, flowInfo }) => {
      if (flowInfo) testFlowInfoMap[testId] = flowInfo;
    });
  }

  return (
    <CandidateDetailScreen
      candidate={candidate}
      allOffers={offers ?? null}
      offer={offer}
      tests={tests}
      testInvites={invites}
      testFlowInfoMap={testFlowInfoMap}
      testSubmissions={submissions}
      latestCompletedSubmission={latestCompletedSubmission}
      latestScoreVM={latestScoreVM}
    />
  );
}
