// app/api/candidate/test/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminForPublicRoute } from "@/infra/supabase/client";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeTestInviteRepo } from "@/infra/supabase/adapters/testInvite.repo.supabase";
import {
  makeStartSubmissionFromInvite,
  makeStartFlowFromInvite,
  makeSubmitSubmissionAnswers,
  SubmitSubmissionError,
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

  const sb = supabaseAdminForPublicRoute();
  const testRepo = makeTestRepo(sb);
  const inviteRepo = makeTestInviteRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);

  try {
    const invite = await inviteRepo.getByToken(token);
    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "Invitation introuvable ou invalide." },
        { status: 404 }
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "Cette invitation a expiré." },
        { status: 404 }
      );
    }

    // ✅ UX FIX : au lieu de 400, on renvoie un état "completed"
    if (invite.status === "completed") {
      return NextResponse.json(
        {
          ok: true,
          data: {
            type: "completed",
            message: "Ce test a déjà été soumis.",
          },
        },
        { status: 200 }
      );
    }

    // Flow mode
    if (invite.flowItemId) {
      const startFlowFromInvite = makeStartFlowFromInvite({
        testRepo,
        inviteRepo,
        flowRepo,
        candidateRepo,
      });

      const flowResult = await startFlowFromInvite({
        orgId: invite.orgId,
        inviteToken: token,
        startedBy: null,
      });

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
    }

    // Test seul
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

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

async function handlePost(req: NextRequest, { token }: { token: string }) {
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing token in URL." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { submissionId, answers } = body as {
    submissionId?: string;
    answers?: { questionId: string; valueText?: string; valueNumber?: number }[];
  };

  if (!submissionId || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { ok: false, error: "submissionId ou answers manquants." },
      { status: 400 }
    );
  }

  const sb = supabaseAdminForPublicRoute();
  const testRepo = makeTestRepo(sb);
  const inviteRepo = makeTestInviteRepo(sb);
  const flowRepo = makeTestFlowRepo(sb);
  const candidateRepo = makeCandidateRepo(sb);

  // Vérifier que l'invite existe pour récupérer l'orgId
  const invite = await inviteRepo.getByToken(token);
  if (!invite) {
    return NextResponse.json(
      { ok: false, error: "Invitation introuvable ou invalide." },
      { status: 404 }
    );
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json(
      { ok: false, error: "Cette invitation a expiré." },
      { status: 404 }
    );
  }

  const orgId = invite.orgId;

  // Utiliser le use case pour toute la logique métier
  const submitSubmissionAnswers = makeSubmitSubmissionAnswers({
    testRepo,
    inviteRepo,
    candidateRepo,
    flowRepo,
  });

  try {
    const result = await submitSubmissionAnswers({
      orgId,
      submissionId,
      answers,
      inviteToken: token, // Le use case validera l'invite et toutes les règles de sécurité
    });

    return NextResponse.json(
      { ok: true, data: { submission: result.submission, answers: result.answers } },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/candidate/test/[token]] error", err);

    // Gérer les erreurs métier avec les bons codes HTTP
    if (err instanceof SubmitSubmissionError) {
      const statusCodeMap: Record<
        SubmitSubmissionError["code"],
        number
      > = {
        NO_ANSWERS: 400,
        SUBMISSION_NOT_FOUND: 404,
        SUBMISSION_ALREADY_COMPLETED: 400,
        INVITE_NOT_FOUND: 404,
        INVITE_EXPIRED: 404,
        INVITE_ALREADY_USED: 400,
        SUBMISSION_NOT_LINKED_TO_CANDIDATE: 403,
        SUBMISSION_NOT_LINKED_TO_INVITE: 400,
        CANDIDATE_WITHOUT_OFFER: 400,
        FLOW_NOT_FOUND: 404,
        SUBMISSION_NOT_IN_FLOW: 403,
        INVALID_QUESTION: 400,
        DUPLICATE_QUESTION: 400,
        MISSING_REQUIRED_QUESTION: 400,
        TEST_NOT_FOUND: 404,
      };

      const statusCode = statusCodeMap[err.code] ?? 400;
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: statusCode }
      );
    }

    // Erreur inconnue
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de l'enregistrement du test.";
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
      { ok: false, error: "Trop de requêtes. Veuillez réessayer dans quelques instants." },
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
      { ok: false, error: "Trop de requêtes. Veuillez réessayer dans quelques instants." },
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
