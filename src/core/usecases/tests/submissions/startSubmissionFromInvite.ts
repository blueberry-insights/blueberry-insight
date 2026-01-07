// core/usecases/tests/startSubmissionFromInvite.ts
import type {
  Test,
  TestQuestion,
  TestSubmission,
} from "@/core/models/Test";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type { TestRepo } from "@/core/ports/TestRepo";

export class StartSubmissionError extends Error {
  code:
    | "INVITE_NOT_FOUND"
    | "INVITE_ORG_MISMATCH"
    | "INVITE_REVOKED"
    | "INVITE_COMPLETED"
    | "INVITE_EXPIRED"
    | "TEST_NOT_FOUND"
    | "TEST_INACTIVE"
    | "NO_QUESTIONS";

  constructor(code: StartSubmissionError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "StartSubmissionError";
  }
}

function shuffleQuestions(questions: TestQuestion[]): TestQuestion[] {
  const arr = [...questions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function makeStartSubmissionFromInvite(deps: {
  testRepo: TestRepo;
  inviteRepo: TestInviteRepo;
}) {
  const { testRepo, inviteRepo } = deps;

  return async function startSubmissionFromInvite(input: {
    orgId: string;
    inviteToken: string;
    startedBy?: string | null;
  }): Promise<{
    test: Test;
    submission: TestSubmission;
    questions: (TestQuestion & { displayIndex: number })[];
  }> {
    const { orgId, inviteToken, startedBy } = input;
    const now = new Date();

    // 1) Récupérer l’invite
    const invite = await inviteRepo.getByToken(inviteToken);

    if (!invite) {
      throw new StartSubmissionError("INVITE_NOT_FOUND", "Invitation introuvable.");
    }

    if (invite.orgId !== orgId) {
      throw new StartSubmissionError(
        "INVITE_ORG_MISMATCH",
        "Cette invitation n'appartient pas à cette organisation."
      );
    }

    if (invite.status === "revoked") {
      throw new StartSubmissionError(
        "INVITE_REVOKED",
        "Cette invitation a été révoquée."
      );
    }

    if (invite.status === "completed") {
      throw new StartSubmissionError(
        "INVITE_COMPLETED",
        "Ce test a déjà été complété."
      );
    }

    const expires = new Date(invite.expiresAt);
    if (expires.getTime() < now.getTime()) {
      throw new StartSubmissionError("INVITE_EXPIRED", "Cette invitation a expiré.");
    }

    // 2) Récupérer le test + questions
    const testWithQuestions = await testRepo.getTestWithQuestions(
      invite.testId,
      orgId
    );

    if (!testWithQuestions) {
      throw new StartSubmissionError(
        "TEST_NOT_FOUND",
        "Le test associé à cette invitation n'existe plus."
      );
    }

    const { test, questions } = testWithQuestions;

    if (!test.isActive) {
      throw new StartSubmissionError(
        "TEST_INACTIVE",
        "Le test associé à cette invitation est désactivé."
      );
    }

    if (!questions.length) {
      throw new StartSubmissionError(
        "NO_QUESTIONS",
        "Aucune question n'est configurée pour ce test."
      );
    }

    // 3) À partir d’ici : 1 invite = 1 seule submission (reprise possible)
    let submission: TestSubmission;
    let questionsWithDisplayIndex: (TestQuestion & { displayIndex: number })[];

    if (invite.submissionId) {
      // ✅ Déjà démarré → on REUTILISE la submission + l’ordre déjà figé
      const existingQuestions =
        await testRepo.getSubmissionQuestionsWithDisplayIndex({
          orgId,
          submissionId: invite.submissionId,
        });

      const aggregate = await testRepo.getSubmissionWithAnswers({
        submissionId: invite.submissionId,
        orgId,
      });

      submission = aggregate.submission;

      questionsWithDisplayIndex =
        existingQuestions.length > 0
          ? existingQuestions
          : shuffleQuestions(questions).map((q, index) => ({
              ...q,
              displayIndex: index + 1,
            }));
    } else {
      // ✅ Première fois → on crée la submission + l’ordre randomisé
      const shuffled = shuffleQuestions(questions);
      questionsWithDisplayIndex = shuffled.map(
        (q, index): TestQuestion & { displayIndex: number } => ({
          ...q,
          displayIndex: index + 1,
        })
      );

      submission = await testRepo.startSubmission({
        orgId,
        testId: invite.testId,
        candidateId: invite.candidateId,
        offerId: undefined,
        submittedBy: startedBy ?? undefined,
        flowId: undefined, // TestInvite doesn't have flowId, only flowItemId
        flowItemId: invite.flowItemId ?? undefined,
      });

      await testRepo.createSubmissionItems({
        orgId,
        submissionId: submission.id,
        items: questionsWithDisplayIndex.map((q) => ({
          questionId: q.id,
          displayIndex: q.displayIndex,
        })),
      });

      await inviteRepo.linkSubmission({
        inviteId: invite.id,
        submissionId: submission.id,
      });
    }

    return {
      test,
      submission,
      questions: questionsWithDisplayIndex,
    };
  };
}
