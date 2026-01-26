// app/api/candidate/test/[token]/video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminForPublicRoute } from "@/infra/supabase/client";
import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";

type Ok = { ok: true; data: { signedUrl: string } };
type Err = { ok: false; error: string };

const SIGNED_URL_TTL = 60 * 5; // 5 minutes (lecture vidéo)

const BUCKET_BLUEBERRY_VIDEOS = "blueberry-videos";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const token = params.token;
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId")?.trim();

    if (!itemId) {
      return NextResponse.json<Err>(
        { ok: false, error: "itemId manquant (query param)" },
        { status: 400 }
      );
    }

    const admin = supabaseAdminForPublicRoute();
    const inviteRepo = makeTestInviteRepo(admin);
    const candidateRepo = makeCandidateRepo(admin);

    // 1) Valider le token (invite)
    const invite = await inviteRepo.getByToken(token);
    if (!invite) {
      return NextResponse.json<Err>(
        { ok: false, error: "Invitation introuvable ou invalide." },
        { status: 404 }
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json<Err>(
        { ok: false, error: "Cette invitation a expiré." },
        { status: 404 }
      );
    }

    // 2) Récupérer le candidat pour obtenir l'offerId
    const candidate = await candidateRepo.getById(invite.orgId, invite.candidateId);
    if (!candidate || !candidate.offerId) {
      return NextResponse.json<Err>(
        { ok: false, error: "Le candidat n'a pas d'offre associée." },
        { status: 404 }
      );
    }

    const offerId = candidate.offerId;

    // 3) Vérifier que l'item appartient bien au flow de cette offre
    //    et récupérer le storage_path de la vidéo
    const { data: itemData, error: itemError } = await admin
      .from("test_flow_items")
      .select(
        `
        id,
        kind,
        video_asset_id,
        test_flows!inner (
          id,
          offer_id
        ),
        video_assets (
          id,
          storage_path,
          target_org_id,
          target_offer_id
        )
      `
      )
      .eq("id", itemId)
      .eq("test_flows.offer_id", offerId)
      .single();

    if (itemError || !itemData) {
      console.error("[GET /api/candidate/test/[token]/video] item error", itemError);
      return NextResponse.json<Err>(
        { ok: false, error: "Bloc vidéo introuvable ou pas lié à cette offre" },
        { status: 404 }
      );
    }

    // 4) Vérifier que c'est bien un item vidéo avec un asset uploadé
    if (itemData.kind !== "video" || !itemData.video_asset_id) {
      return NextResponse.json<Err>(
        { ok: false, error: "Aucune vidéo uploadée pour ce bloc" },
        { status: 404 }
      );
    }

    // 5) Récupérer le storage_path
    type VideoAssetRow = {
      id: string;
      storage_path: string;
      target_org_id: string | null;
      target_offer_id: string | null;
    };
    
    type ItemDataWithRelations = typeof itemData & {
      video_assets: VideoAssetRow | VideoAssetRow[] | null;
    };
    
    const videoAsset = Array.isArray((itemData as ItemDataWithRelations).video_assets)
      ? (itemData as ItemDataWithRelations).video_assets[0]
      : (itemData as ItemDataWithRelations).video_assets;

    if (!videoAsset?.storage_path) {
      return NextResponse.json<Err>(
        { ok: false, error: "Vidéo introuvable (storage_path manquant)" },
        { status: 404 }
      );
    }

    // 6) Vérifier scope vidéo si target_org_id/target_offer_id sont utilisés
    // (optionnel, mais bon à avoir pour la sécurité)
    if (videoAsset.target_org_id && videoAsset.target_org_id !== invite.orgId) {
      return NextResponse.json<Err>(
        { ok: false, error: "Accès interdit (scope vidéo)" },
        { status: 403 }
      );
    }
    if (videoAsset.target_offer_id && videoAsset.target_offer_id !== offerId) {
      return NextResponse.json<Err>(
        { ok: false, error: "Accès interdit (scope vidéo)" },
        { status: 403 }
      );
    }

    // 7) Générer la signed URL de lecture
    const { data: signed, error: signedErr } = await admin.storage
      .from(BUCKET_BLUEBERRY_VIDEOS)
      .createSignedUrl(videoAsset.storage_path, SIGNED_URL_TTL);

    if (signedErr || !signed?.signedUrl) {
      console.error("[GET /api/candidate/test/[token]/video] signed URL error", signedErr);
      return NextResponse.json<Err>(
        { ok: false, error: "Impossible de générer l'URL vidéo" },
        { status: 500 }
      );
    }

    return NextResponse.json<Ok>({ ok: true, data: { signedUrl: signed.signedUrl } });
  } catch (e) {
    console.error("[GET /api/candidate/test/[token]/video] error", e);
    return NextResponse.json<Err>(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
