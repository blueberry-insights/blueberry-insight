import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";
import { makeEnrichOffersWithUserNames } from "@/core/usecases/offers/enrichOffersWithUserNames";

import { OffersScreen } from "@/features/offers/components/screens/OffersScreen";

export default async function OffersPage() {
  const { orgId } = await requireUserAndOrgForPage("/offers");
  const sb = await supabaseServerRSC(); 
  const offerRepo = makeOfferRepo(sb);
  const offers = await offerRepo.listByOrg(orgId);
  
  // Enrichir les offres avec les noms d'utilisateurs via usecase
  const userInfoRepo = makeUserInfoRepoForAction();
  const enrichOffers = makeEnrichOffersWithUserNames(userInfoRepo);
  const enrichedOffers = await enrichOffers(offers);
  
  return <OffersScreen initialOffers={enrichedOffers} orgId={orgId} />;
  
}
