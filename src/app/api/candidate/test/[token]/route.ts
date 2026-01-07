// app/api/candidate/test/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminForPublicRoute } from "@/infra/supabase/client";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import {
  makeStartSubmissionFromInvite,
  makeStartFlowFromInvite,
  computeMotivationScore,
} from "@/core/usecases/tests";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { getClientIp, isRateLimited } from "@/infra/rateLimit/rateLimit";

async function handleGet(_req: NextRequest, { token }: { token: string }) {
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing token in URL." },
      { status: 400 }
    );
  }
  // Utiliser le client admin pour les routes publiques avec token
  // ⚠️ La sécurité est assurée par validation stricte du token dans le code
  const sb = supabaseAdminForPublicRoute();
  const testRepo = makeTestRepo(sb);
  const inviteRepo = makeTestInviteRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);

  try {
    // Validation stricte du token : vérifier existence + expiration
    const invite = await inviteRepo.getByToken(token);
    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "Invitation introuvable ou invalide." },
        { status: 404 }
      );
    }

    // Vérifier que l'invite n'est pas expirée
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "Cette invitation a expiré." },
        { status: 404 }
      );
    }

    // Vérifier que l'invite n'est pas déjà complétée
    if (invite.status === "completed") {
      return NextResponse.json(
        { ok: false, error: "Cette invitation a déjà été utilisée." },
        { status: 400 }
      );
    }

    // Si l'invite a un flowItemId, utiliser le flow
    console.log(
      "[GET /api/candidate/test/[token]] invite.flowItemId:",
      invite.flowItemId
    );
    if (invite.flowItemId) {
      console.log(
        "[GET /api/candidate/test/[token]] Démarrage du flow avec flowItemId:",
        invite.flowItemId
      );
      const startFlowFromInvite = makeStartFlowFromInvite({
        testRepo,
        inviteRepo,
        flowRepo,
        candidateRepo,
      });

      try {
        const flowResult = await startFlowFromInvite({
          orgId: invite.orgId,
          inviteToken: token,
          startedBy: null,
        });

        console.log(
          "[GET /api/candidate/test/[token]] Flow démarré avec succès, items:",
          flowResult.items.length
        );

        return NextResponse.json(
          {
            ok: true,
            data: {
              type: "flow",
              flow: flowResult.flow,
              items: flowResult.items,
              currentItemIndex: flowResult.currentItemIndex,
              currentItem: flowResult.currentItem,
            },
          },
          { status: 200 }
        );
      } catch (flowError) {
        console.error(
          "[GET /api/candidate/test/[token]] Erreur lors du démarrage du flow:",
          flowError
        );
        // En cas d'erreur avec le flow, on peut fallback sur le test seul
        // ou retourner l'erreur selon le besoin
        throw flowError;
      }
    } else {
      console.log(
        "[GET /api/candidate/test/[token]] Pas de flowItemId, utilisation du test seul"
      );
    }

    // Sinon, utiliser le comportement classique (test seul)
    const startSubmissionFromInvite = makeStartSubmissionFromInvite({
      testRepo,
      inviteRepo,
    });

    const result = await startSubmissionFromInvite({
      orgId: invite.orgId,
      inviteToken: token,
      startedBy: null,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          type: "test",
          test: result.test,
          submission: result.submission,
          questions: result.questions,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /api/candidate/test/[token]] error", err);

    const message =
      err instanceof Error ? err.message : "Erreur lors du démarrage du test.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}

async function handlePost(req: NextRequest, { token }: { token: string }) {
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token in URL." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { submissionId, answers } = body as {
    submissionId?: string;
    answers?: { questionId: string; valueText?: string; valueNumber?: number }[];
  };

  if (!submissionId || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ ok: false, error: "submissionId ou answers manquants." }, { status: 400 });
  }

  const sb = supabaseAdminForPublicRoute();
  const testRepo = makeTestRepo(sb);
  const inviteRepo = makeTestInviteRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);

  const invite = await inviteRepo.getByToken(token);
  if (!invite) {
    return NextResponse.json({ ok: false, error: "Invitation introuvable ou invalide." }, { status: 404 });
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ ok: false, error: "Cette invitation a expiré." }, { status: 404 });
  }

  const orgId = invite.orgId;

  // 1) Charger la submission demandée
  const submission = await testRepo.getSubmissionById({ orgId, submissionId });
  if (!submission) {
    return NextResponse.json({ ok: false, error: "Submission introuvable." }, { status: 404 });
  }

  // 2) Sécurité : la submission doit appartenir au même candidat que l’invite
  if (submission.candidateId !== invite.candidateId) {
    return NextResponse.json({ ok: false, error: "Cette submission n'est pas liée à ce candidat." }, { status: 403 });
  }

  const isFlowMode = Boolean(invite.flowItemId);

  // 3) Validation “invitation déjà utilisée”
  // ✅ En flow mode, on autorise l’utilisation tant que le flow n’est pas fini
  if (!isFlowMode && invite.status === "completed") {
    return NextResponse.json({ ok: false, error: "Cette invitation a déjà été utilisée." }, { status: 400 });
  }

  // 4) Validation spécifique TEST SEUL
  if (!isFlowMode) {
    if (!invite.submissionId || invite.submissionId !== submissionId) {
      return NextResponse.json(
        { ok: false, error: "Invitation introuvable ou non liée à cette submission. Le lien a peut-être expiré." },
        { status: 400 }
      );
    }
  }

  // 5) Validation spécifique FLOW
  // (approche actuelle via offer -> flow)
  let flowData: Awaited<ReturnType<typeof flowRepo.getFlowByOffer>> | null = null;

  if (isFlowMode) {
    const candidate = await candidateRepo.getById(orgId, invite.candidateId);
    if (!candidate?.offerId) {
      return NextResponse.json({ ok: false, error: "Candidat sans offre associée." }, { status: 400 });
    }

    flowData = await flowRepo.getFlowByOffer({ orgId, offerId: candidate.offerId });
    if (!flowData) {
      return NextResponse.json({ ok: false, error: "Parcours introuvable." }, { status: 404 });
    }

    const allowedFlowItemIds = new Set(flowData.items.map((it) => it.id));

    if (!submission.flowItemId || !allowedFlowItemIds.has(submission.flowItemId)) {
      return NextResponse.json({ ok: false, error: "Cette submission ne fait pas partie du parcours." }, { status: 403 });
    }
  }

  // 6) Charger les questions autorisées pour CETTE submission (ordre figé)
  const allowed = await testRepo.getSubmissionQuestionsWithDisplayIndex({ orgId, submissionId });
  const allowedQuestionIds = new Set(allowed.map((q) => q.id));

  for (const a of answers) {
    if (!allowedQuestionIds.has(a.questionId)) {
      return NextResponse.json(
        { ok: false, error: "Réponse invalide : une ou plusieurs questions ne font pas partie de ce test." },
        { status: 400 }
      );
    }
  }

  const unique = new Set<string>();
  for (const a of answers) {
    if (unique.has(a.questionId)) {
      return NextResponse.json(
        { ok: false, error: "Réponse invalide : une question a été répondue plusieurs fois." },
        { status: 400 }
      );
    }
    unique.add(a.questionId);
  }

  const requiredQuestionIds = new Set(allowed.filter((q) => q.isRequired).map((q) => q.id));
  for (const rq of requiredQuestionIds) {
    if (!unique.has(rq)) {
      return NextResponse.json(
        { ok: false, error: "Certaines questions obligatoires n'ont pas été répondues. Merci de compléter le test." },
        { status: 400 }
      );
    }
  }

  // ✅ IMPORTANT : scorer sur le test de la submission, PAS sur invite.testId
  const testWithQuestions = await testRepo.getTestWithQuestions(submission.testId, orgId);
  if (!testWithQuestions) {
    return NextResponse.json({ ok: false, error: "Test associé introuvable." }, { status: 404 });
  }

  const { test, questions } = testWithQuestions;
  const { numericScore, maxScore } = computeMotivationScore({ test, questions, answers });

  try {
    const { submission: updatedSubmission, answers: storedAnswers } = await testRepo.submitAnswers({
      orgId,
      submissionId,
      answers,
      numericScore: numericScore ?? undefined,
      maxScore: maxScore ?? undefined,
    });

    // ✅ TEST SEUL : on termine l’invite direct
    if (!isFlowMode) {
      await inviteRepo.markCompleted({ inviteId: invite.id });
    } else {
      // ✅ FLOW : on termine seulement si tout le flow est complété
      // flowData est non-null ici
      const testItemIds = flowData!.items
        .filter((it) => it.kind === "test")
        .map((it) => it.id);

      // récupère toutes les submissions du candidat liées à ces items
      const { data: subs, error: subsErr } = await sb
        .from("test_submissions")
        .select("id, flow_item_id")
        .eq("org_id", orgId)
        .eq("candidate_id", invite.candidateId)
        .in("flow_item_id", testItemIds);

      if (subsErr) throw subsErr;

      const subIds = (subs ?? []).map((s) => s.id);

      const { data: answeredRows, error: ansErr } = await sb
        .from("test_answers")
        .select("submission_id")
        .in("submission_id", subIds);

      if (ansErr) throw ansErr;

      const answeredSet = new Set((answeredRows ?? []).map((r) => r.submission_id));
      const isFlowCompleted = subIds.length > 0 && subIds.every((id) => answeredSet.has(id));

      if (isFlowCompleted) {
        await inviteRepo.markCompleted({ inviteId: invite.id });
      }
    }

    return NextResponse.json(
      { ok: true, data: { submission: updatedSubmission, answers: storedAnswers } },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/candidate/test/[token]] error", err);
    const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement du test.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


// Wrapper pour appliquer le rate limiting
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const ip = getClientIp(req);

  if (isRateLimited(ip, "GET")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Window": "60",
        },
      }
    );
  }

  const params = await context.params;
  return handleGet(req, params);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const ip = getClientIp(req);

  if (isRateLimited(ip, "POST")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Window": "60",
        },
      }
    );
  }

  const params = await context.params;
  return handlePost(req, params);
}
