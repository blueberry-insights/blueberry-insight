"use server";

import type { CandidateListItem } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeAttachCandidateCv } from "@/core/usecases/candidates/uploadCandidatCv";
import { makeUpdateCandidate } from "@/core/usecases/candidates/updateCandidate";

type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };

export type UploadCvResult = Ok | Err;

export async function uploadCandidateCvAction(formData: FormData): Promise<UploadCvResult> {
  return withAuth(async (ctx) => {
    const file = formData.get("cv") as File | null;
    const candidateId = String(formData.get("candidateId") || "").trim();

    if (!file || !candidateId) {
      return { ok: false, error: "Fichier ou candidat manquant" };
    }

    const orgId = ctx.orgId;
    if (!orgId) {
      return { ok: false, error: "Organisation introuvable pour cet utilisateur" };
    }

    const sb = ctx.sb;


    const bucket = "candidate-cv";
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${orgId}/${candidateId}/cv.${ext}`;

    const { error: uploadError } = await sb.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/pdf",
      });

    if (uploadError) {
      console.error("[uploadCandidateCvAction] upload error", uploadError);
      return { ok: false, error: "Erreur lors de l'upload du CV" };
    }

    const repo = makeCandidateRepo(sb);
    const attachCv = makeAttachCandidateCv(repo);

    try {
      const candidate = await attachCv({
        orgId,
        candidateId,
        cvPath: path,
        originalName: file.name,
        mimeType: file.type || "application/pdf",
        sizeBytes: file.size,
      });

      return { ok: true, candidate };
    } catch (e) {
      console.error("[uploadCandidateCvAction] attachCv error", e);
      return { ok: false, error: "Impossible d'attacher le CV au candidat" };
    }
  });
}

export async function updateCandidateAction(formData: FormData): Promise<Ok | Err> {
  return withAuth(async (ctx): Promise<Ok | Err> => {
    const candidateId = String(formData.get("id") ?? "");
    const offerIdRaw = formData.get("offerId");
    const offerId = offerIdRaw === "none" || offerIdRaw === "" ? null : String(offerIdRaw ?? "");

    if (!candidateId) {
      return { ok: false, error: "Candidat manquant" };
    }

    const repo = makeCandidateRepo(ctx.sb);
    
    // Récupérer le candidat actuel pour préserver les autres champs
    const currentCandidate = await repo.getById(ctx.orgId, candidateId);
    
    if (!currentCandidate) {
      return { ok: false, error: "Candidat introuvable" };
    }

    const updateCandidate = makeUpdateCandidate(repo);

    try {
      const candidate = await updateCandidate({
        orgId: ctx.orgId,
        candidateId,
        fullName: currentCandidate.fullName,
        email: currentCandidate.email ?? null,
        status: currentCandidate.status ?? undefined,
        source: currentCandidate.source ?? null,
        tags: currentCandidate.tags ?? [],
        note: currentCandidate.note ?? null,
        offerId: offerId,
      });

      return { ok: true, candidate };
    } catch (e) {
      console.error("[updateCandidateAction] updateCandidate error", e);
      return { ok: false, error: "Impossible de mettre à jour le candidat" };
    }
  });
}