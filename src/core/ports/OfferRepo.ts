import type { OfferListItem, Offer, OfferStatus } from "@/core/models/Offer";

export type RemotePolicy = "full_remote" | "hybrid" | "on_site";
export type ContractType = "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance";

export type CreateOfferInput = {
  orgId: string;
  title: string;
  description?: string | null;
  status?: OfferStatus;
  city?: string | null;
  country?: string | null;
  isRemote?: boolean;
  remotePolicy?: RemotePolicy | null;
  contractType?: ContractType | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  // Gestion des responsabilités
  createdBy: string; // User qui a créé l'offre (obligatoire)
  responsibleUserId: string; // User responsable de l'offre (obligatoire pour l'instant)
};

export type UpdateOfferInput = {
  orgId: string;
  offerId: string;
  title?: string;
  description?: string | null;
  status?: OfferStatus;
  city?: string | null;
  country?: string | null;
  isRemote?: boolean;
  remotePolicy?: RemotePolicy | null;
  contractType?: ContractType | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
};

export interface OfferRepo {
  listByOrg(orgId: string): Promise<OfferListItem[]>;
  getById(orgId: string, offerId: string): Promise<Offer | null>;
  create(input: CreateOfferInput): Promise<Offer>;
  update(input: UpdateOfferInput): Promise<Offer>;
  deleteById(input: { orgId: string; offerId: string }): Promise<void>;
}
