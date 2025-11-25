
import type { OfferListItem, Offer } from "@/core/models/Offer";

export type CreateOfferInput = {
  orgId: string;
  title: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
};

export type UpdateOfferInput = {
  orgId: string;
  offerId: string;
  title?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
};

export interface OfferRepo {
  listByOrg(orgId: string): Promise<OfferListItem[]>;
  getById(orgId: string, offerId: string): Promise<Offer | null>;
  create(input: CreateOfferInput): Promise<Offer>;
  update(input: UpdateOfferInput): Promise<Offer>;
}
