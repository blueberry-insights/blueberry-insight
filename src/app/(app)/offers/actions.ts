"use server";

import { ZodError } from "zod";
import type { OfferListItem } from "@/core/models/Offer";
import { withAuth } from "@/infra/supabase/session";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeCreateOffer } from "@/core/usecases/offers/createOffer";
import { makeUpdateOffer } from "@/core/usecases/offers/updateOffer";
import { makeDeleteOffer } from "@/core/usecases/offers/deleteOffer";
import { supabaseAdmin } from "@/infra/supabase/client";

type Ok = { ok: true; offer: OfferListItem };
type Err = { ok: false; error: string };
type DeleteOk = { ok: true };
type DeleteErr = { ok: false; error: string };

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
      
      let userName: string | null = null;
      if (ctx.userId) {
        try {
          const adminClient = supabaseAdmin();
          const { data: userData } = await adminClient.auth.admin.getUserById(ctx.userId);
          userName = userData?.user?.user_metadata?.full_name ?? null;
        } catch (err) {
          console.warn(`Unable to fetch user ${ctx.userId}:`, err);
        }
      }
      
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
        responsibleUserName: userName,
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
      
      // Récupérer l'offre complète avec tous les champs
      const fullOffer = await repo.getById(ctx.orgId, offer.id);
      
      if (!fullOffer) {
        return { ok: false, error: "Offre introuvable après mise à jour" };
      }
      
      // Récupérer les noms des utilisateurs en parallèle (optimisation)
      const adminClient = supabaseAdmin();
      const [responsibleUserName] = await Promise.all([
        // Récupérer le nom du responsable
        fullOffer.responsibleUserId
          ? adminClient.auth.admin
              .getUserById(fullOffer.responsibleUserId)
              .then(
                ({ data }) => data?.user?.user_metadata?.full_name ?? null
              )
              .catch((err) => {
                console.warn(
                  `Unable to fetch user ${fullOffer.responsibleUserId}:`,
                  err
                );
                return null;
              })
          : Promise.resolve(null),
        // Récupérer le nom du créateur
        fullOffer.createdBy
          ? adminClient.auth.admin
              .getUserById(fullOffer.createdBy)
              .then(
                ({ data }) => data?.user?.user_metadata?.full_name ?? null
              )
              .catch((err) => {
                console.warn(`Unable to fetch user ${fullOffer.createdBy}:`, err);
                return null;
              })
          : Promise.resolve(null),
      ]);
      
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