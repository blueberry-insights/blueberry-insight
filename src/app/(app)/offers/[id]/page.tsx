import { notFound } from "next/navigation";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { OfferDetailScreen } from "@/features/offers/components";
import { supabaseServerRSC } from "@/infra/supabase/client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireUserAndOrgForPage("/offers/[id]");
  const sb = await supabaseServerRSC();
  const offerRepo = makeOfferRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);

  const offer = await offerRepo.getById(orgId, id);
  if (!offer) {
    notFound();
  }
  const allCandidates = await candidateRepo.listByOrg(orgId);
  
  const associatedCandidates = allCandidates.filter(
    (c) => c.offerId === offer.id
  );

  return (
    <OfferDetailScreen offer={offer} candidates={associatedCandidates} />
  );
}
