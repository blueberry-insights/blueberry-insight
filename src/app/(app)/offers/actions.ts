"use server";

import { z, ZodError } from "zod";
import { withAuth } from "@/infra/supabase/session";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import type { Offer } from "@/core/models/Offer";
import { offerStatusValues } from "@/core/models/Offer";

type Ok = { ok: true; offer: Offer };
type Err = { ok: false; error: string };

const OfferSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z
    .string()
    .trim()
    .max(5000, "La description est trop longue")
    .optional()
    .nullable(),
  status: z
    .enum(offerStatusValues)
    .optional()
    .nullable(),
});

export async function createOfferAction(formData: FormData): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    try {
      const parsed = OfferSchema.parse({
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status") || "draft",
      });

      const repo = makeOfferRepo(ctx.sb);

      const offer = await repo.create({
        orgId: ctx.orgId,
        title: parsed.title,
        description: parsed.description ?? null,
        status: parsed.status ?? "draft",
      });

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
