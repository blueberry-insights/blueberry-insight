// src/app/(app)/candidates/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { CandidatesScreen } from "@/features/candidates/components";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";
import { makeEnrichOffersWithUserNames } from "@/core/usecases/offers/enrichOffersWithUserNames";

export default async function CandidatesPage() {
  const { orgId } = await requireUserAndOrgForPage("/candidates");

  const sb = await supabaseServerRSC();
  const candidateRepo = makeCandidateRepo(sb);
  const offerRepo = makeOfferRepo(sb);

  const [candidates, offers] = await Promise.all([
    candidateRepo.listByOrg(orgId),
    offerRepo.listByOrg(orgId),
  ]);

  const userInfoRepo = makeUserInfoRepoForAction();
  const enrichOffers = makeEnrichOffersWithUserNames(userInfoRepo);
  const enrichedOffers = await enrichOffers(offers);

  return <CandidatesScreen
    orgId={orgId}
    initialCandidates={candidates}
    offers={enrichedOffers}
  />;
}
