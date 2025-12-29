// app/candidate/test/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeTestInfraForServiceRole } from "@/infra/supabase/composition";
import { makeStartSubmissionFromInvite } from "@/core/usecases/tests/startSubmissionFromInvite";

type RouteContext = {
  params: { token: string };
};

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const token = ctx.params.token;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing token in URL." },
      { status: 400 }
    );
  }

  const { testRepo, testInviteRepo } = makeTestInfraForServiceRole();

  const startSubmissionFromInvite = makeStartSubmissionFromInvite({
    testRepo,
    inviteRepo: testInviteRepo,
  });

  try {
    const invite = await testInviteRepo.getByToken(token);
    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "Invitation introuvable ou invalide." },
        { status: 404 }
      );
    }

    const result = await startSubmissionFromInvite({
      orgId: invite.orgId,
      inviteToken: token,
      startedBy: null,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          test: result.test,
          submission: result.submission,
          questions: result.questions,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /candidate/test/[token]] error", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors du démarrage du test.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const token = ctx.params.token;

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
    answers?: {
      questionId: string;
      valueText?: string;
      valueNumber?: number;
    }[];
  };

  if (!submissionId || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { ok: false, error: "submissionId ou answers manquants." },
      { status: 400 }
    );
  }

  const { testRepo, testInviteRepo } = makeTestInfraForServiceRole();

  const invite = await testInviteRepo.getByToken(token);
  if (!invite || !invite.submissionId || invite.submissionId !== submissionId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invitation introuvable ou non liée à cette submission. Le lien a peut-être expiré.",
      },
      { status: 400 }
    );
  }

  const orgId = invite.orgId;

  const testWithQuestions = await testRepo.getTestWithQuestions(
    invite.testId,
    orgId
  );

  if (!testWithQuestions) {
    return NextResponse.json(
      { ok: false, error: "Test associé introuvable." },
      { status: 404 }
    );
  }

  const { test, questions } = testWithQuestions;

  let numericScore: number | undefined;
  let maxScore: number | undefined;

  if (test.type === "motivations") {
    const scoredQuestions = questions.filter(
      (q) => q.kind === "yes_no" || q.kind === "choice" || q.kind === "scale"
    );

    maxScore = scoredQuestions.length;

    const answersByQuestion = new Map(
      answers.map((a) => [a.questionId, a] as const)
    );

    let score = 0;
    for (const q of scoredQuestions) {
      const a = answersByQuestion.get(q.id);
      if (!a) continue;

      if (q.kind === "yes_no") {
        if (a.valueText?.toLowerCase() === "yes") {
          score += 1;
        }
      } else {
        score += 1;
      }
    }

    numericScore = score;
  }

  try {
    const { submission, answers: storedAnswers } = await testRepo.submitAnswers({
      orgId,
      submissionId,
      answers,
      numericScore,
      maxScore,
    });

    await testInviteRepo.markCompleted({ inviteId: invite.id });

    return NextResponse.json(
      { ok: true, data: { submission, answers: storedAnswers } },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /candidate/test/[token]] error", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'enregistrement du test.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
