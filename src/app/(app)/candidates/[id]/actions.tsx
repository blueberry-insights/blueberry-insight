"use server";

import type { CandidateListItem } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeAttachCandidateCv } from "@/core/usecases/candidates/uploadCandidatCv";
import { makeUpdateCandidate } from "@/core/usecases/candidates/updateCandidate";
import { Test, TestInvite, TestType, TestRef } from "@/core/models/Test";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import { makeSendTestInviteForCandidate } from "@/core/usecases/tests/invites/sendTestInviteForCandidate";
import { env } from "@/config/env";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import {
  validateCvFile,
  getFileValidationErrorMessage,
} from "@/shared/validation/fileValidation";
import { getStringTrimmed, getStringOrNull, getString, getNumber } from "@/shared/utils/formData";

type SendInviteOk = {
  ok: true;
  invite: TestInvite;
  test: TestRef;
  url: string | null;
};

type SendInviteErr = {
  ok: false;
  error: string;
};
type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };

export type UploadCvResult = Ok | Err;

export async function uploadCandidateCvAction(
  formData: FormData
): Promise<UploadCvResult> {
  return withAuth(async (ctx) => {
    const file = formData.get("cv") as File | null;
    const candidateId = getStringTrimmed(formData, "candidateId");

    if (!file || !candidateId) {
      return { ok: false, error: "Fichier ou candidat manquant" };
    }

    const validation = validateCvFile(file);
    if (!validation.ok) {
      const errorMessage = getFileValidationErrorMessage(validation.error);
      console.warn("[uploadCandidateCvAction] Fichier rejeté:", {
        fileName: file.name,
        size: file.size,
        type: file.type,
        error: validation.error,
      });
      return { ok: false, error: errorMessage };
    }

    const orgId = ctx.orgId;
    if (!orgId) {
      return {
        ok: false,
        error: "Organisation introuvable pour cet utilisateur",
      };
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

export async function updateCandidateAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx): Promise<Ok | Err> => {
    const candidateId = getStringTrimmed(formData, "id");
    const offerIdRaw = getStringOrNull(formData, "offerId");
    const offerId =
      offerIdRaw === "none" || offerIdRaw === ""
        ? null
        : String(offerIdRaw ?? "");

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

export async function sendCandidateTestInviteAction(
  formData: FormData
): Promise<SendInviteOk | SendInviteErr> {
  return withAuth(async (ctx): Promise<SendInviteOk | SendInviteErr> => {
    const candidateId =  getStringTrimmed(formData, "candidateId");
    const testId = getStringTrimmed(formData, "testId");
    const expiresInDaysRaw = getString(formData, "expiresInDays");

    if (!candidateId || !testId) {
      return { ok: false, error: "Candidat ou test manquant." };
    }

    const expiresInDays = getNumber(formData, "expiresInDays") || 3 ;
    const expiresInHours = expiresInDays * 24;

    const { sb, orgId } = ctx;

    try {
      const testRepo = makeTestRepo(sb);
      const inviteRepo = makeTestInviteRepo(sb);
      const candidateRepo = makeCandidateRepo(sb);
      const testFlowRepo = makeTestFlowRepo(sb);

      // 1) test interne org (celui que l'orga a créé)
      let test: Test | TestRef | null = await testRepo.getTestById(testId, orgId);

      // 2) sinon, test catalogue Blueberry (autorisé pour cette org) via RPC security definer
      if (!test) {
        const { data: catalogItem, error: catErr } = await sb
          .rpc("get_blueberry_test_catalog_item", {
            p_org_id: orgId,
            p_test_id: testId,
          })
          .maybeSingle();

        if (catErr) {
          console.error(
            "[sendCandidateTestInviteAction] catalog lookup error",
            catErr
          );
          return {
            ok: false,
            error: "Impossible de vérifier le test catalogue.",
          };
        }

        if (catalogItem) {
          // normalise pour matcher ton type Test (mets juste les champs dont tu as besoin)
          test = {
            id: catalogItem.id,
            name: catalogItem.name,
            type: catalogItem.type as TestType,
          } as TestRef;
        }
      }

      if (!test) {
        return {
          ok: false,
          error: "Test introuvable ou non autorisé pour cette organisation.",
        };
      }

      // Récupérer le candidat pour obtenir son offerId
      const candidate = await candidateRepo.getById(orgId, candidateId);
      if (!candidate) {
        return {
          ok: false,
          error: "Candidat introuvable.",
        };
      }

      let flowItemId: string | null = null;
      if (candidate.offerId) {
        try {
          const flowData = await testFlowRepo.getFlowByOffer({
            orgId,
            offerId: candidate.offerId,
          });

          if (flowData) {
            // Trouver le flow item qui correspond au testId
            const flowItem = flowData.items.find(
              (item) => item.kind === "test" && item.testId === testId
            );
            if (flowItem) {
              flowItemId = flowItem.id;
              console.log(
                "[sendCandidateTestInviteAction] flowItemId trouvé:",
                flowItemId,
                "pour testId:",
                testId
              );
            } else {
              console.log(
                "[sendCandidateTestInviteAction] testId",
                testId,
                "non trouvé dans le flow pour l'offre",
                candidate.offerId
              );
            }
          } else {
            console.log(
              "[sendCandidateTestInviteAction] aucun flow trouvé pour l'offre",
              candidate.offerId
            );
          }
        } catch (err) {
          console.error(
            "[sendCandidateTestInviteAction] erreur lors de la récupération du flow:",
            err
          );
        }
      } else {
        console.log(
          "[sendCandidateTestInviteAction] candidat sans offre associée, pas de flowItemId"
        );
      }

      // 👉 On construit le usecase UNE fois
      const sendInvite = makeSendTestInviteForCandidate({
        inviteRepo,
        candidateRepo,
      });

      // 👉 On l'appelle avec les bons paramètres
      const { invite } = await sendInvite({
        orgId,
        candidateId,
        testId,
        expiresInHours,
        flowItemId,
      });

      const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "";
      const url = baseUrl
        ? `${baseUrl}/candidate/test/${invite.token}`
        : `/candidate/test/${invite.token}`;

      return {
        ok: true,
        invite,
        test,
        url,
      };
    } catch (err) {
      console.error("[sendCandidateTestInviteAction] error", err);
      return {
        ok: false,
        error: "Impossible d'envoyer le test.",
      };
    }
  });
}
