// src/app/(app)/candidates/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { CandidatesScreen } from "@/features/candidates/components/CandidatesScreen";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";

export default async function CandidatesPage() {
  const { orgId } = await requireUserAndOrgForPage("/candidates");

  const sb = await supabaseServerRSC();
  const candidateRepo = makeCandidateRepo(sb);
  const offerRepo = makeOfferRepo(sb);

  const [candidates, offers] = await Promise.all([
    candidateRepo.listByOrg(orgId),
    offerRepo.listByOrg(orgId),
  ]);

  return <CandidatesScreen
    orgId={orgId}
    initialCandidates={candidates}
    offers={offers}
  />;
}
