"use server";

import type { CandidateListItem } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeAttachCandidateCv } from "@/core/usecases/candidates/uploadCandidatCv";

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
