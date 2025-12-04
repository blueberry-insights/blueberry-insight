import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";

import { OffersScreen } from "@/features/offers/components/screens/OffersScreen";

export default async function OffersPage() {
  const { orgId } = await requireUserAndOrgForPage("/offers");
  const sb = await supabaseServerRSC(); 
  const offerRepo = makeOfferRepo(sb);
  const offers = await offerRepo.listByOrg(orgId);
  
  return <OffersScreen initialOffers={offers} orgId={orgId} />;
  
}
