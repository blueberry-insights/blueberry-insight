
import { notFound } from "next/navigation";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { CandidateDetailScreen } from "@/features/candidates/components";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";
import { makeEnrichOffersWithUserNames } from "@/core/usecases/offers/enrichOffersWithUserNames"

import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import { makeListCandidateInvites } from "@/core/usecases/tests/invites/listCandidateInvites";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeGetTestFlowItemForOffer } from "@/core/usecases/tests/flows/getTestFlowItemForOffer";

import type { OfferListItem } from "@/core/models/Offer";
import type { TestFlowItemInfo } from "@/core/usecases/tests/flows/getTestFlowItemForOffer";

type Props = {
    params: Promise<{ id: string }>;
  };
export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireUserAndOrgForPage("/candidates/[id]");
  const sb = await supabaseServerRSC();
  const inviteRepo = makeTestInviteRepo(sb);
  const testRepo = makeTestRepo(sb);
  const tests = await testRepo.listTestsByOrg(orgId);
  const candidateRepo = makeCandidateRepo(sb);
  const offerRepo = makeOfferRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);

  const listCandidateInvites = makeListCandidateInvites({ inviteRepo, testRepo });

const invites = await listCandidateInvites({
  orgId: orgId,
  candidateId: id,
});
  const candidate = await candidateRepo.getById(orgId, id);
  if (!candidate) {
    notFound();
  }

  let offer = null;
  let offers: OfferListItem[] | null = null;
  const testFlowInfoMap: Record<string, TestFlowItemInfo> = {};
  
  if (candidate.offerId) {
    const rawOffers = await offerRepo.listByOrg(orgId);
    
    // Enrichir les offres avec les noms d'utilisateurs via usecase
    const userInfoRepo = makeUserInfoRepoForAction();
    const enrichOffers = makeEnrichOffersWithUserNames(userInfoRepo);
    offers = await enrichOffers(rawOffers);
    
    offer = offers.find((o) => o.id === candidate.offerId) ?? null;

    // Récupérer les informations de flow pour chaque test
    if (candidate.offerId) {
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
        if (flowInfo) {
          testFlowInfoMap[testId] = flowInfo;
        }
      });
    }
  }

  return <CandidateDetailScreen candidate={candidate} allOffers={offers ?? null} offer={offer} tests={tests}  testInvites={invites} testFlowInfoMap={testFlowInfoMap} />;
}

