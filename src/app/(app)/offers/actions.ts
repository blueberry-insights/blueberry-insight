"use server";

import { ZodError } from "zod";
import type { Offer } from "@/core/models/Offer";
import { withAuth } from "@/infra/supabase/session";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import { makeCreateOffer } from "@/core/usecases/offers/createOffer";

type Ok = { ok: true; offer: Offer };
type Err = { ok: false; error: string };

export async function createOfferAction(formData: FormData): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const raw = {
      orgId: ctx.orgId,
      title: formData.get("title"),
      description: formData.get("description") || null,
      status: formData.get("status") || undefined,
    };

    const repo = makeOfferRepo(ctx.sb);
    const createOffer = makeCreateOffer(repo);

    try {
      const offer = await createOffer(raw);
      return { ok: true, offer };
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
