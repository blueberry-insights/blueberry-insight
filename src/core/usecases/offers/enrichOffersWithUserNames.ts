/**
 * Usecase pour enrichir les offres avec les noms d'utilisateurs.
 * 
 * Récupère les noms des utilisateurs responsables et créateurs
 * et les ajoute aux offres.
 */
import type { OfferListItem } from "@/core/models/Offer";
import type { UserInfoRepo } from "@/core/ports/UserInfoRepo";

export function makeEnrichOffersWithUserNames(userInfoRepo: UserInfoRepo) {
  return async (offers: OfferListItem[]): Promise<OfferListItem[]> => {
    // Extraire tous les userIds uniques
    const userIds = Array.from(
      new Set(
        offers
          .flatMap((offer) => [offer.createdBy, offer.responsibleUserId])
          .filter((id): id is string => id !== null)
      )
    );

    if (userIds.length === 0) {
      return offers;
    }

    // Récupérer les infos utilisateur
    const userInfoMap = await userInfoRepo.getUsersByIds(userIds);

    // Enrichir les offres
    return offers.map((offer) => ({
      ...offer,
      responsibleUserName: offer.responsibleUserId
        ? userInfoMap.get(offer.responsibleUserId)?.fullName ?? null
        : null,
    }));
  };
}

