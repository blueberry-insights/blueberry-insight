// app/(app)/offers/[id]/tests/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import type { TestFlowItem } from "@/core/models/TestFlow";

type Err = { ok: false; error: string };
type Ok<T> = { ok: true; data: T };

export async function createFlowForOfferAction(
  formData: FormData
): Promise<Ok<{ id: string }> | Err> {
  return withAuth(async (ctx) => {
    try {
      const offerId = String(formData.get("offerId") ?? "").trim();
      if (!offerId) {
        return { ok: false, error: "offerId manquant" };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      const flow = await repo.createFlow({
        orgId: ctx.orgId,
        offerId,
        name: `Parcours de tests pour ${offerId}`,
        isActive: true,
        createdBy: ctx.userId,
      });

      revalidatePath(`/offers/${offerId}/tests`);
      return { ok: true, data: { id: flow.id } };
    } catch (e) {
      console.error("[createFlowForOfferAction]", e);
      return { ok: false, error: "Erreur lors de la création du parcours" };
    }
  });
}

type AddFlowItemOk = Ok<TestFlowItem>;
type DeleteOk = Ok<null>;

export async function addFlowVideoItemAction(
  formData: FormData
): Promise<AddFlowItemOk | Err> {
  return withAuth(async (ctx) => {
    try {
      const raw = {
        orgId: ctx.orgId,
        offerId: String(formData.get("offerId") ?? "").trim(),
        flowId: String(formData.get("flowId") ?? "").trim(),
        title: String(formData.get("title") ?? "").trim() || undefined,
        description: String(formData.get("description") ?? "").trim() || undefined,
        videoUrl: String(formData.get("videoUrl") ?? "").trim(),
        orderIndex: Number(formData.get("orderIndex") ?? 1),
        kind: "video" as const,
        isRequired: true,
      };

      if (!raw.offerId || !raw.flowId || !raw.videoUrl) {
        return {
          ok: false,
          error: "Champs manquants (flowId, offerId, videoUrl)",
        };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      const created = await repo.addItem(raw);

      revalidatePath(`/offers/${raw.offerId}/tests`);
      return { ok: true, data: created };
    } catch (e) {
      console.error("[addFlowVideoItemAction]", e);
      return {
        ok: false,
        error: "Erreur lors de l'ajout du bloc vidéo",
      };
    }
  });
}

export async function addFlowTestItemAction(
  formData: FormData
): Promise<AddFlowItemOk | Err> {
  return withAuth(async (ctx) => {
    try {
      const raw = {
        orgId: ctx.orgId,
        offerId: String(formData.get("offerId") ?? "").trim(),
        flowId: String(formData.get("flowId") ?? "").trim(),
        testId: String(formData.get("testId") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || undefined,
        title: String(formData.get("title") ?? "").trim() || undefined,
        orderIndex: Number(formData.get("orderIndex") ?? 1),
        kind: "test" as const,
        isRequired: true,
      };

      if (!raw.offerId || !raw.flowId || !raw.testId) {
        return {
          ok: false,
          error: "Champs manquants (flowId, offerId, testId)",
        };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      const created = await repo.addItem(raw);

      revalidatePath(`/offers/${raw.offerId}/tests`);
      return { ok: true, data: created };
    } catch (e) {
      console.error("[addFlowTestItemAction]", e);
      return {
        ok: false,
        error: "Erreur lors de l'ajout du bloc test",
      };
    }
  });
}
export async function deleteFlowItemAction(
  formData: FormData
): Promise<DeleteOk | Err> {
  return withAuth(async (ctx) => {
    try {
      const offerId = String(formData.get("offerId") ?? "").trim();
      const itemId = String(formData.get("itemId") ?? "").trim();

      if (!offerId || !itemId) {
        return {
          ok: false,
          error: "Champs manquants (offerId, itemId)",
        };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      await repo.deleteItem({ orgId: ctx.orgId, itemId });

      revalidatePath(`/offers/${offerId}/tests`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[deleteFlowItemAction]", e);
      return {
        ok: false,
        error: "Erreur lors de la suppression du bloc",
      };
    }
  });
}
