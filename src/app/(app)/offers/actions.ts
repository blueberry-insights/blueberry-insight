"use server";

import type { OfferListItem, Offer } from "@/core/models/Offer";
import { createActionHandler } from "@/shared/utils/actionHandler";
import type { OfferRepo, RemotePolicy, ContractType } from "@/core/ports/OfferRepo";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeCreateOffer, type OfferInput } from "@/core/usecases/offers/createOffer";
import { makeUpdateOffer, type UpdateOfferInput } from "@/core/usecases/offers/updateOffer";
import { makeDeleteOffer, type DeleteOfferInput } from "@/core/usecases/offers/deleteOffer";
import { makeArchiveOffer, type ArchiveOfferInput } from "@/core/usecases/offers/archiveOffer";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";
import {
  getStringTrimmed,
  getStringOrNull,
  getNumberOrNull,
  getBoolean,
  getTypedOrUndefined,
} from "@/shared/utils/formData";

type Ok = { ok: true; offer: OfferListItem };
type Err = { ok: false; error: string };
type DeleteOk = { ok: true };
type DeleteErr = { ok: false; error: string };
type ArchiveOk = { ok: true };
type ArchiveErr = { ok: false; error: string };

export type DeleteOfferResult = DeleteOk | DeleteErr;

/**
 * Helper pour enrichir une Offer avec responsibleUserName et candidateCount
 */
async function enrichOfferListItem(offer: Offer): Promise<OfferListItem> {
  const userInfoRepo = makeUserInfoRepoForAction();
  const userIds = [offer.responsibleUserId, offer.createdBy].filter(
    (id): id is string => id !== null
  );
  const userInfoMap = await userInfoRepo.getUsersByIds(userIds);
  const responsibleUserName = offer.responsibleUserId
    ? userInfoMap.get(offer.responsibleUserId)?.fullName ?? null
    : null;

  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    status: offer.status,
    city: offer.city,
    country: offer.country,
    isRemote: offer.isRemote,
    remotePolicy: offer.remotePolicy,
    contractType: offer.contractType,
    salaryMin: offer.salaryMin,
    salaryMax: offer.salaryMax,
    currency: offer.currency,
    createdBy: offer.createdBy,
    responsibleUserId: offer.responsibleUserId,
    responsibleUserName,
    candidateCount: 0,
  };
}

export const createOfferAction = createActionHandler<
  OfferInput,
  Offer,
  OfferRepo,
  OfferListItem
>({
  actionName: "createOfferAction",
  errorMessage: "Erreur lors de la création de l'offre",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    title: getStringTrimmed(formData, "title"),
    description: getStringOrNull(formData, "description"),
    status: getTypedOrUndefined(formData, "status"),
    city: getStringOrNull(formData, "city"),
    country: getStringOrNull(formData, "country"),
    isRemote: getBoolean(formData, "isRemote"),
    remotePolicy: getTypedOrUndefined<RemotePolicy>(formData, "remotePolicy") ?? null,
    contractType: getTypedOrUndefined<ContractType>(formData, "contractType") ?? null,
    salaryMin: getNumberOrNull(formData, "salaryMin"),
    salaryMax: getNumberOrNull(formData, "salaryMax"),
    currency: getStringOrNull(formData, "currency"),
    createdBy: ctx.userId,
    responsibleUserId: ctx.userId,
  }),
  makeRepo: (sb) => makeOfferRepo(sb),
  makeUsecase: (repo) => makeCreateOffer(repo),
  afterUsecase: async (_ctx, _input, offer) => {
    return enrichOfferListItem(offer);
  },
  transformResult: (offerListItem) => ({
    ok: true as const,
    offer: offerListItem,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;

export const updateOfferAction = createActionHandler<
  UpdateOfferInput,
  Offer,
  OfferRepo,
  OfferListItem
>({
  actionName: "updateOfferAction",
  errorMessage: "Erreur lors de la mise à jour de l'offre",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    offerId: getStringTrimmed(formData, "id"),
    title: getStringTrimmed(formData, "title"),
    description: getStringOrNull(formData, "description"),
    status: getTypedOrUndefined(formData, "status"),
    city: getStringOrNull(formData, "city"),
    country: getStringOrNull(formData, "country"),
    isRemote: getBoolean(formData, "isRemote"),
    remotePolicy: getTypedOrUndefined<RemotePolicy>(formData, "remotePolicy") ?? null,
    contractType: getTypedOrUndefined<ContractType>(formData, "contractType") ?? null,
    salaryMin: getNumberOrNull(formData, "salaryMin"),
    salaryMax: getNumberOrNull(formData, "salaryMax"),
    currency: getStringOrNull(formData, "currency"),
  }),
  makeRepo: (sb) => makeOfferRepo(sb),
  makeUsecase: (repo) => makeUpdateOffer(repo),
  afterUsecase: async (ctx, _input, offer) => {
    // Récupérer l'offre complète depuis le repo pour avoir tous les champs
    const repo = makeOfferRepo(ctx.sb);
    const fullOffer = await repo.getById(ctx.orgId, offer.id);
    if (!fullOffer) {
      throw new Error("Offre introuvable après mise à jour");
    }
    return enrichOfferListItem(fullOffer);
  },
  transformResult: (offerListItem) => ({
    ok: true as const,
    offer: offerListItem,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;

export const deleteOfferAction = createActionHandler<
  DeleteOfferInput,
  void,
  OfferRepo,
  void
>({
  actionName: "deleteOfferAction",
  errorMessage: "Erreur lors de la suppression de l'offre",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    offerId: getStringTrimmed(formData, "offerId"),
  }),
  makeRepo: (sb) => makeOfferRepo(sb),
  makeUsecase: (repo) => makeDeleteOffer(repo),
  transformResult: () => ({
    ok: true as const,
  }),
}) as (formData: FormData) => Promise<DeleteOfferResult>;

export const archiveOfferAction = createActionHandler<
  ArchiveOfferInput,
  void,
  OfferRepo,
  void
>({
  actionName: "archiveOfferAction",
  errorMessage: "Erreur lors de l'archivage de l'offre",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    offerId: getStringTrimmed(formData, "offerId"),
  }),
  makeRepo: (sb) => makeOfferRepo(sb),
  makeUsecase: (repo) => makeArchiveOffer(repo),
  beforeUsecase: async (_ctx, input) => {
    if (!input.orgId) {
      return { ok: false, error: "Organisation introuvable." };
    }
    if (!input.offerId) {
      return { ok: false, error: "Offre introuvable." };
    }
    return null;
  },
  transformResult: () => ({
    ok: true as const,
  }),
}) as (formData: FormData) => Promise<ArchiveOk | ArchiveErr>;
