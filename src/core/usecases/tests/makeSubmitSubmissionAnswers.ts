// core/usecases/makeSubmitSubmissionAnswers.ts
import type { TestRepo } from "@/core/ports/TestRepo";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import { computeMotivationScore } from "./computeMotivationScore";
import type { TestQuestion } from "@/core/models/Test";

export class SubmitSubmissionError extends Error {
  code:
    | "SUBMISSION_NOT_FOUND"
    | "SUBMISSION_ALREADY_COMPLETED"
    | "NO_ANSWERS";

  constructor(code: SubmitSubmissionError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "SubmitSubmissionError";
  }
}

export function makeSubmitSubmissionAnswers(deps: {
  testRepo: TestRepo;
  inviteRepo: TestInviteRepo;
}) {
  const { testRepo, inviteRepo } = deps;

  return async function submitSubmissionAnswers(input: {
    orgId: string;
    submissionId: string;
    answers: {
      questionId: string;
      valueText?: string;
      valueNumber?: number;
    }[];
    inviteId?: string;
  }) {
    const { orgId, submissionId, answers, inviteId } = input;

    if (!answers.length) {
      throw new SubmitSubmissionError("NO_ANSWERS", "Aucune réponse envoyée.");
    }

    // 1) Récupérer submission + test + questions
    let aggregate: {
      submission: Awaited<ReturnType<TestRepo["getSubmissionWithAnswers"]>>["submission"];
      test: Awaited<ReturnType<TestRepo["getSubmissionWithAnswers"]>>["test"];
      questions: TestQuestion[];
      answers: Awaited<ReturnType<TestRepo["getSubmissionWithAnswers"]>>["answers"];
    };

    try {
      aggregate = await testRepo.getSubmissionWithAnswers({
        submissionId,
        orgId,
      });
    } catch (err) {
      // Ici on enveloppe le "not found" en erreur métier si besoin
      const e = err as Error;
      if (e.message?.includes("submission not found")) {
        throw new SubmitSubmissionError(
          "SUBMISSION_NOT_FOUND",
          "Ce test n'existe plus ou n'est pas accessible."
        );
      }
      throw err;
    }

    const { submission, test, questions } = aggregate;

    // 2) Protection "déjà complété" (si tu veux la rendre stricte plus tard)
    // if (submission.submittedAt) {
    //   throw new SubmitSubmissionError(
    //     "SUBMISSION_ALREADY_COMPLETED",
    //     "Ce test a déjà été complété."
    //   );
    // }

    // 3) Calcul du score uniquement pour les tests de motivations
    let numericScore: number | undefined;
    let maxScore: number | undefined;

    if (test.type === "motivations") {
      const score = computeMotivationScore({
        test,
        questions,
        answers,
      });

      numericScore = score.numericScore ?? undefined;
      maxScore = score.maxScore ?? undefined;
    }

    // 4) Persister les réponses + éventuel score
    const result = await testRepo.submitAnswers({
      orgId,
      submissionId,
      answers,
      numericScore,
      maxScore,
    });

    // 5) Marquer l'invitation comme complétée (si fournie)
    if (inviteId) {
      await inviteRepo.markCompleted({
        inviteId,
        // completedAt: new Date().toISOString(), // optionnel
      });
    }

    return result;
  };
}
