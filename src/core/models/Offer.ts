
export const offerStatusValues = ["draft", "published", "archived"] as const;
export type OfferStatus = (typeof offerStatusValues)[number];

export type Offer = {
  id: string;
  orgId: string;
  title: string;
  createdAt: string;
  description: string | null;
  status: OfferStatus;
};

export type OfferListItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  status: OfferStatus;
};