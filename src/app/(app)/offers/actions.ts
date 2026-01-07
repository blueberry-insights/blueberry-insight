"use server";

import { ZodError } from "zod";
import type { OfferListItem } from "@/core/models/Offer";
import { withAuth } from "@/infra/supabase/session";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeCreateOffer } from "@/core/usecases/offers/createOffer";
import { makeUpdateOffer } from "@/core/usecases/offers/updateOffer";
import { makeDeleteOffer } from "@/core/usecases/offers/deleteOffer";
import { makeArchiveOffer } from "@/core/usecases/offers/archiveOffer";
import { makeUserInfoRepoForAction } from "@/infra/supabase/composition";

type Ok = { ok: true; offer: OfferListItem };
type Err = { ok: false; error: string };
type DeleteOk = { ok: true };
type DeleteErr = { ok: false; error: string };
type ArchiveOk = { ok: true };
type ArchiveErr = { ok: false; error: string };

export type DeleteOfferResult = DeleteOk | DeleteErr;

export async function createOfferAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const raw = {
      orgId: ctx.orgId,
      title: formData.get("title"),
      description: formData.get("description") || null,
      status: formData.get("status") || undefined,
      city: formData.get("city") || null,
      country: formData.get("country") || null,
      isRemote: formData.get("isRemote") === "true",
      remotePolicy: formData.get("remotePolicy") || null,
      contractType: formData.get("contractType") || null,
      salaryMin: formData.get("salaryMin")
        ? Number(formData.get("salaryMin"))
        : null,
      salaryMax: formData.get("salaryMax")
        ? Number(formData.get("salaryMax"))
        : null,
      currency: formData.get("currency") || null,
      createdBy: ctx.userId,
      responsibleUserId: ctx.userId,
    };

    const repo = makeOfferRepo(ctx.sb);
    const createOffer = makeCreateOffer(repo);

    try {
      const offer = await createOffer(raw);
      
      // Récupérer le nom de l'utilisateur responsable
      const userInfoRepo = makeUserInfoRepoForAction();
      const userInfo = ctx.userId ? await userInfoRepo.getUserById(ctx.userId) : null;
      
      const offerListItem: OfferListItem = {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        createdAt: offer.createdAt,
        updatedAt: null,
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
        responsibleUserName: userInfo?.fullName ?? null,
        candidateCount: 0,
      };
      return { ok: true, offer: offerListItem };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[createOfferAction] error:", err);
      return { ok: false, error: "Erreur lors de la création de l'offre" };
    }
  });
}

export async function updateOfferAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const raw = {
      orgId: ctx.orgId,
      offerId: formData.get("id") as string,
      title: formData.get("title"),
      description: formData.get("description") || null,
      status: formData.get("status") || undefined,
      city: formData.get("city") || null,
      country: formData.get("country") || null,
      isRemote: formData.get("isRemote") === "true",
      remotePolicy: formData.get("remotePolicy") || null,
      contractType: formData.get("contractType") || null,
      salaryMin: formData.get("salaryMin")
        ? Number(formData.get("salaryMin"))
        : null,
      salaryMax: formData.get("salaryMax")
        ? Number(formData.get("salaryMax"))
        : null,
      currency: formData.get("currency") || null,
    };

    const repo = makeOfferRepo(ctx.sb);
    const updateOffer = makeUpdateOffer(repo);

    try {
      const offer = await updateOffer(raw);
      
      const fullOffer = await repo.getById(ctx.orgId, offer.id);
      
      if (!fullOffer) {
        return { ok: false, error: "Offre introuvable après mise à jour" };
      }
      
      const userInfoRepo = makeUserInfoRepoForAction();
      const userIds = [
        fullOffer.responsibleUserId,
        fullOffer.createdBy,
      ].filter((id): id is string => id !== null);
      
      const userInfoMap = await userInfoRepo.getUsersByIds(userIds);
      const responsibleUserName = fullOffer.responsibleUserId
        ? userInfoMap.get(fullOffer.responsibleUserId)?.fullName ?? null
        : null;
      
      const offerListItem: OfferListItem = {
        id: fullOffer.id,
        title: fullOffer.title,
        description: fullOffer.description,
        createdAt: fullOffer.createdAt,
        updatedAt: fullOffer.updatedAt,
        status: fullOffer.status,
        city: fullOffer.city,
        country: fullOffer.country,
        isRemote: fullOffer.isRemote,
        remotePolicy: fullOffer.remotePolicy,
        contractType: fullOffer.contractType,
        salaryMin: fullOffer.salaryMin,
        salaryMax: fullOffer.salaryMax,
        currency: fullOffer.currency,
        createdBy: fullOffer.createdBy,
        responsibleUserId: fullOffer.responsibleUserId,
        responsibleUserName,
        candidateCount: 0,
      };
      return { ok: true, offer: offerListItem };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[updateOfferAction] error:", err);
      return { ok: false, error: "Erreur lors de la mise à jour de l'offre" };
    }
  });
}

export async function deleteOfferAction(
  formData: FormData
): Promise<DeleteOk | DeleteErr> {
  return withAuth(async (ctx) => {
    const raw = {
      orgId: ctx.orgId,
      offerId: formData.get("offerId") as string,
    };
    const repo = makeOfferRepo(ctx.sb);
    const deleteOffer = makeDeleteOffer(repo);
    try {
      await deleteOffer(raw);
      return { ok: true };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }
      console.error("[deleteOfferAction] error:", err);
      return { ok: false, error: "Erreur lors de la suppression de l'offre" };
    }
  });
}

export async function archiveOfferAction(
  formData: FormData
): Promise<ArchiveOk | ArchiveErr> {
  return withAuth(async (ctx) => {
    const orgId = ctx.orgId;
    if (!orgId) return { ok: false, error: "Organisation introuvable." };

    const offerId = String(formData.get("offerId") ?? "").trim();
    if (!offerId) return { ok: false, error: "Offre introuvable." };

    const repo = makeOfferRepo(ctx.sb);
    const archiveOffer = makeArchiveOffer(repo);

    try {
      await archiveOffer({ orgId, offerId });
      return { ok: true };
    } catch (err) {
      console.error("[archiveOfferAction] error:", err);
      return { ok: false, error: "Erreur lors de l’archivage de l’offre." };
    }
  });
}