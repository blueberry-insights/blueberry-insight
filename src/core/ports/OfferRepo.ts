import type { OfferListItem } from "@/core/models/Offer";

export interface OfferRepo {
  listByOrg(orgId: string): Promise<OfferListItem[]>;
}