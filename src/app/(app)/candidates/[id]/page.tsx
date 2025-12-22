
import { notFound } from "next/navigation";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { CandidateDetailScreen } from "@/features/candidates/components";
import { supabaseServerRSC } from "@/infra/supabase/client";

type Props = {
    params: Promise<{ id: string }>;
  };
export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireUserAndOrgForPage("/candidates/[id]");
  const sb = await supabaseServerRSC();
  const candidateRepo = makeCandidateRepo(sb);
  const offerRepo = makeOfferRepo(sb);

  const candidate = await candidateRepo.getById(orgId, id);
  if (!candidate) {
    notFound();
  }

  let offer = null;
  let offers = null;
  if (candidate.offerId) {
    offers = await offerRepo.listByOrg(orgId);
    offer = offers.find((o) => o.id === candidate.offerId) ?? null;
  }

  return <CandidateDetailScreen candidate={candidate} allOffers={offers ?? null} offer={offer} />;
}