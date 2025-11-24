// src/app/(app)/candidates/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { CandidatesScreen } from "@/features/candidates/components/CandidatesScreen";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";

export default async function CandidatesPage() {
  const { orgId } = await requireUserAndOrgForPage("/candidates");

  const sb = await supabaseServerRSC();
  const repo = makeCandidateRepo(sb);
  const candidates = await repo.listByOrg(orgId);
  const offerRepo = makeOfferRepo(sb);
  const offers = await offerRepo.listByOrg(orgId);
  return <CandidatesScreen
    orgId={orgId}
    initialCandidates={candidates}
    offers={offers}
  />;
}
