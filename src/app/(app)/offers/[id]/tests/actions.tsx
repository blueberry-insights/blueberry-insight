// app/(app)/offers/[id]/tests/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeOfferRepo } from "@/infra/supabase/adapters/offer.repo.supabase";
import type { TestFlowItem } from "@/core/models/TestFlow";

import { supabaseAdmin } from "@/infra/supabase/client";

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

      const offerRepo = makeOfferRepo(ctx.sb);
      const offer = await offerRepo.getById(ctx.orgId, offerId);
      const offerName = offer?.title ?? offerId;

      const repo = makeTestFlowRepo(ctx.sb);
      const flow = await repo.createFlow({
        orgId: ctx.orgId,
        offerId,
        name: `Parcours - ${offerName}`,
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

// --- AJOUTS (ne cassent pas l’existant) ---
export async function addFlowVideoItemAction(
  formData: FormData
): Promise<AddFlowItemOk | Err> {
  return withAuth(async (ctx) => {
    try {
      const offerId = String(formData.get("offerId") ?? "").trim();
      const flowId = String(formData.get("flowId") ?? "").trim();
      const title = String(formData.get("title") ?? "").trim() || undefined;
      const description =
        String(formData.get("description") ?? "").trim() || undefined;

      // ✅ URL externe optionnelle (on peut créer le bloc puis uploader)
      const videoUrlRaw = String(formData.get("videoUrl") ?? "").trim();
      const videoUrl = videoUrlRaw ? videoUrlRaw : undefined;

      const orderIndex = Number(formData.get("orderIndex") ?? 1);

      if (!offerId || !flowId) {
        return {
          ok: false,
          error: "Champs manquants (flowId, offerId)",
        };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      const created = await repo.addItem({
        orgId: ctx.orgId,
        flowId,
        title,
        description,
        videoUrl: videoUrl || undefined, // Permet draft sans URL
        orderIndex,
        kind: "video" as const,
        isRequired: true,
      });

      revalidatePath(`/offers/${offerId}/tests`);
      return { ok: true, data: created };
    } catch (e) {
      console.error("[addFlowVideoItemAction]", e);
      return { ok: false, error: "Erreur lors de l'ajout du bloc vidéo" };
    }
  });
}

export async function addFlowTestItemAction(
  formData: FormData
): Promise<AddFlowItemOk | Err> {
  return withAuth(async (ctx) => {
    try {
      const offerId = String(formData.get("offerId") ?? "").trim();
      const flowId = String(formData.get("flowId") ?? "").trim();
      const testId = String(formData.get("testId") ?? "").trim();
      const title = String(formData.get("title") ?? "").trim() || undefined;
      const description =
        String(formData.get("description") ?? "").trim() || undefined;
      const orderIndex = Number(formData.get("orderIndex") ?? 1);

      if (!offerId || !flowId || !testId) {
        return {
          ok: false,
          error: "Champs manquants (flowId, offerId, testId)",
        };
      }

      const repo = makeTestFlowRepo(ctx.sb);
      const created = await repo.addItem({
        orgId: ctx.orgId,
        flowId,
        testId,
        title,
        description,
        orderIndex,
        kind: "test" as const,
        isRequired: true,
      });

      revalidatePath(`/offers/${offerId}/tests`);
      return { ok: true, data: created };
    } catch (e) {
      console.error("[addFlowTestItemAction]", e);
      return { ok: false, error: "Erreur lors de l'ajout du bloc test" };
    }
  });
}

const BUCKET_BLUEBERRY_VIDEOS = "blueberry-videos";
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

function getBlueberryOrgId(): string {
  const blueberryOrgId = process.env.BLUEBERRY_ORG_ID;
  if (!blueberryOrgId) throw new Error("BLUEBERRY_ORG_ID manquant (env)");
  return blueberryOrgId;
}

/**
 * ✅ NEW: demande une signed upload URL (pas de File qui transite => pas de limite 1MB Next)
 *
 * Attendu formData:
 * - offerId
 * - itemId
 * - fileName
 * - mimeType
 * - sizeBytes
 */
export async function requestFlowVideoUploadAction(
  formData: FormData
): Promise<Ok<{ bucket: string; path: string; token: string }> | Err> {
  return withAuth(async (ctx) => {
    try {
      // (optionnel) : si tu veux verrouiller à Blueberry only
      // if (ctx.orgId !== getBlueberryOrgId()) return { ok: false, error: "Unauthorized" };

      const offerId = String(formData.get("offerId") ?? "").trim();
      const itemId = String(formData.get("itemId") ?? "").trim();
      const fileName = String(formData.get("fileName") ?? "").trim();
      const mimeType = String(formData.get("mimeType") ?? "").trim();
      const sizeBytes = Number(formData.get("sizeBytes") ?? 0);

      if (!offerId || !itemId) {
        return { ok: false, error: "Champs manquants (offerId, itemId)" };
      }
      if (!fileName || !mimeType || !sizeBytes) {
        return { ok: false, error: "Métadonnées fichier manquantes" };
      }
      if (!mimeType.startsWith("video/")) {
        return { ok: false, error: "Le fichier doit être une vidéo (video/*)" };
      }
      if (sizeBytes > MAX_VIDEO_BYTES) {
        return { ok: false, error: "Vidéo trop lourde (200MB max)" };
      }

      const admin = supabaseAdmin();

      // ✅ Vérifie que l’item appartient bien à l’offre (via flow -> offer)
      const { data: check, error: checkErr } = await admin
        .from("test_flow_items")
        .select("id, test_flows!inner(offer_id)")
        .eq("id", itemId)
        .eq("test_flows.offer_id", offerId)
        .single();

      if (checkErr || !check) {
        console.error("[requestFlowVideoUploadAction] check error", checkErr);
        return {
          ok: false,
          error: "Bloc introuvable ou pas lié à cette offre",
        };
      }

      const ext = fileName.includes(".") ? fileName.split(".").pop() : "mp4";
      const safeExt = (ext || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `videos/${crypto.randomUUID()}.${safeExt}`;

      const { data, error } = await admin.storage
        .from(BUCKET_BLUEBERRY_VIDEOS)
        .createSignedUploadUrl(path);

      if (error || !data) {
        console.error("[requestFlowVideoUploadAction] signed upload error", error);
        return { ok: false, error: "Impossible de générer l’URL d’upload" };
      }

      // data: { signedUrl, path, token }
      return {
        ok: true,
        data: {
          bucket: BUCKET_BLUEBERRY_VIDEOS,
          path: data.path,
          token: data.token,
        },
      };
    } catch (e) {
      console.error("[requestFlowVideoUploadAction]", e);
      return { ok: false, error: "Erreur serveur (signed upload)" };
    }
  });
}

/**
 * ✅ NEW: après upload client->storage, on enregistre l’asset + on attache au flow item
 *
 * Attendu formData:
 * - offerId
 * - itemId
 * - storagePath
 * - mimeType
 * - sizeBytes
 * - (optionnel) title
 */
export async function attachUploadedVideoToFlowItemAction(
  formData: FormData
): Promise<AddFlowItemOk | Err> {
  return withAuth(async (ctx) => {
    try {
      // (optionnel) : si tu veux verrouiller à Blueberry only
      if (ctx.orgId !== getBlueberryOrgId()) return { ok: false, error: "Unauthorized" };

      const offerId = String(formData.get("offerId") ?? "").trim();
      const itemId = String(formData.get("itemId") ?? "").trim();
      const storagePath = String(formData.get("storagePath") ?? "").trim();
      const mimeType = String(formData.get("mimeType") ?? "").trim();
      const sizeBytes = Number(formData.get("sizeBytes") ?? 0);
      const title = String(formData.get("title") ?? "").trim() || null;

      if (!offerId || !itemId) {
        return { ok: false, error: "Champs manquants (offerId, itemId)" };
      }
      if (!storagePath) {
        return { ok: false, error: "storagePath manquant" };
      }
      if (!mimeType.startsWith("video/")) {
        return { ok: false, error: "mimeType invalide" };
      }
      if (!sizeBytes || sizeBytes > MAX_VIDEO_BYTES) {
        return { ok: false, error: "sizeBytes invalide" };
      }

      const admin = supabaseAdmin();
      const blueberryOrgId = getBlueberryOrgId();

      // ✅ Vérifie item ↔ offer (idem)
      const { data: check, error: checkErr } = await admin
        .from("test_flow_items")
        .select("id, test_flows!inner(offer_id)")
        .eq("id", itemId)
        .eq("test_flows.offer_id", offerId)
        .single();

      if (checkErr || !check) {
        console.error("[attachUploadedVideoToFlowItemAction] check error", checkErr);
        return {
          ok: false,
          error: "Bloc introuvable ou pas lié à cette offre",
        };
      }

      // 1) Insert video_assets
      const { data: asset, error: assetErr } = await admin
        .from("video_assets")
        .insert({
          org_id: blueberryOrgId,
          title,
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: sizeBytes,
        })
        .select("*")
        .single();

      if (assetErr || !asset) {
        console.error("[attachUploadedVideoToFlowItemAction] insert asset error", assetErr);
        return { ok: false, error: "Impossible d’enregistrer la vidéo (DB)" };
      }

      // 2) Attach au flow item + neutralise l’URL externe (évite ambiguïté)
      const { data: updatedItem, error: updErr } = await admin
        .from("test_flow_items")
        .update({
          video_asset_id: asset.id,
          video_url: null,
        })
        .eq("id", itemId)
        .select("*")
        .single();

      if (updErr || !updatedItem) {
        console.error("[attachUploadedVideoToFlowItemAction] update item error", updErr);
        return { ok: false, error: "Impossible d’attacher la vidéo au bloc" };
      }

      revalidatePath(`/offers/${offerId}/tests`);
      return { ok: true, data: updatedItem as unknown as TestFlowItem };
    } catch (e) {
      console.error("[attachUploadedVideoToFlowItemAction]", e);
      return { ok: false, error: "Erreur serveur (attach vidéo)" };
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
