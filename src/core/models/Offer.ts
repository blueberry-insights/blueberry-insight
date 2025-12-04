import { ContractType, RemotePolicy } from "../ports/OfferRepo";

export const offerStatusValues = ["draft", "published", "archived"] as const;
export type OfferStatus = (typeof offerStatusValues)[number];

export type Offer = {
  id: string;
  orgId: string;
  title: string;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  remotePolicy: RemotePolicy | null;
  contractType: ContractType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string | null;
  description: string | null;
  status: OfferStatus;
  // Gestion des responsabilités
  createdBy: string | null; // User qui a créé l'offre (audit, jamais modifié)
  responsibleUserId: string | null; // User responsable de l'offre (modifiable)
};

export type OfferListItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: OfferStatus;
  city: string | null;
  country: string | null;
  isRemote: boolean;
  remotePolicy: RemotePolicy | null;
  contractType: ContractType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  candidateCount: number;
  createdBy: string | null; // User ID du créateur
  createdByName: string | null; // Nom complet du créateur
  responsibleUserId: string | null; // User ID du responsable
  responsibleUserName: string | null; // Nom complet du responsable
};