"use server";
import { makeUpdateOffer } from "@/core/usecases/offers/updateOffer";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { withAuth } from "@/infra/supabase/session";
import { getStringTrimmed } from "@/shared/utils/formData";


export async function updateOfferDetailsAction(formData: FormData) {
return withAuth(async (ctx) => {

  const offerId = getStringTrimmed(formData, "id");
  const status = getStringTrimmed(formData, "status") || null;
  const repo = makeOfferRepo(ctx.sb);
  const currentOffer = await repo.getById(ctx.orgId, offerId);
  if (!currentOffer) {
    return { ok: false, error: "Offre introuvable" };
  }
  const updateOffer = makeUpdateOffer(repo);

  try {
    const offer = await updateOffer({
      orgId: ctx.orgId,
      offerId,
      title: currentOffer.title,
      description: currentOffer.description,
      status,
      city: currentOffer.city,
      country: currentOffer.country,
      isRemote: currentOffer.isRemote,
      remotePolicy: currentOffer.remotePolicy,
      contractType: currentOffer.contractType,
      salaryMin: currentOffer.salaryMin,
      salaryMax: currentOffer.salaryMax,
      currency: currentOffer.currency,
      createdBy: currentOffer.createdBy,
      responsibleUserId: currentOffer.responsibleUserId,
    });

    if (!offer) {
      return { ok: false, error: "Erreur lors de la mise à jour de l'offre" };
    }
    return { ok: true, offer: offer };
  } catch {
    return { ok: false, error: "Erreur lors de la mise à jour de l'offre" };
  }
})}
