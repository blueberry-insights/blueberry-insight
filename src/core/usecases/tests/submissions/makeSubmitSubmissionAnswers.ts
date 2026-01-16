// core/usecases/makeSubmitSubmissionAnswers.ts
import type { TestRepo } from "@/core/ports/TestRepo";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";

// ✅ v2.5 : UN SEUL moteur
import { computeMotivationScoring } from "@/core/usecases/tests/scoring/computeMotivationScoring";
import { MotivationScoringResult } from "@/core/models/Test";

export class SubmitSubmissionError extends Error {
  code:
    | "SUBMISSION_NOT_FOUND"
    | "SUBMISSION_ALREADY_COMPLETED"
    | "NO_ANSWERS"
    | "INVITE_NOT_FOUND"
    | "INVITE_EXPIRED"
    | "INVITE_ALREADY_USED"
    | "SUBMISSION_NOT_LINKED_TO_CANDIDATE"
    | "SUBMISSION_NOT_LINKED_TO_INVITE"
    | "CANDIDATE_WITHOUT_OFFER"
    | "FLOW_NOT_FOUND"
    | "SUBMISSION_NOT_IN_FLOW"
    | "INVALID_QUESTION"
    | "DUPLICATE_QUESTION"
    | "MISSING_REQUIRED_QUESTION"
    | "TEST_NOT_FOUND";

  constructor(code: SubmitSubmissionError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "SubmitSubmissionError";
  }
}

export function makeSubmitSubmissionAnswers(deps: {
  testRepo: TestRepo;
  inviteRepo: TestInviteRepo;
  candidateRepo: CandidateRepo;
  flowRepo: TestFlowRepo;
}) {
  const { testRepo, inviteRepo, candidateRepo, flowRepo } = deps;

  return async function submitSubmissionAnswers(input: {
    orgId: string;
    submissionId: string;
    answers: {
      questionId: string;
      valueText?: string;
      valueNumber?: number;
    }[];
    inviteToken?: string;
  }) {
    const { orgId, submissionId, answers, inviteToken } = input;

    if (!answers.length) {
      throw new SubmitSubmissionError("NO_ANSWERS", "Aucune réponse envoyée.");
    }

    // ============================================================================
    // VALIDATIONS DE SÉCURITÉ (si inviteToken fourni)
    // ============================================================================
    let invite = null;
    if (inviteToken) {
      invite = await inviteRepo.getByToken(inviteToken);
      if (!invite) {
        throw new SubmitSubmissionError(
          "INVITE_NOT_FOUND",
          "Invitation introuvable ou invalide."
        );
      }

      if (new Date(invite.expiresAt) < new Date()) {
        throw new SubmitSubmissionError(
          "INVITE_EXPIRED",
          "Cette invitation a expiré."
        );
      }

      if (invite.orgId !== orgId) {
        throw new SubmitSubmissionError(
          "INVITE_NOT_FOUND",
          "Invitation introuvable ou invalide."
        );
      }
    }

    // 1) Charger la submission demandée
    const submission = await testRepo.getSubmissionById({
      orgId,
      submissionId,
    });
    if (!submission) {
      throw new SubmitSubmissionError(
        "SUBMISSION_NOT_FOUND",
        "Submission introuvable."
      );
    }

    // 2) Sécurité : la submission doit appartenir au même candidat que l'invite (si invite fournie)
    if (invite && submission.candidateId !== invite.candidateId) {
      throw new SubmitSubmissionError(
        "SUBMISSION_NOT_LINKED_TO_CANDIDATE",
        "Cette submission n'est pas liée à ce candidat."
      );
    }

    const isFlowMode = Boolean(invite?.flowItemId);

    // 3) Validation "invitation déjà utilisée" (test seul uniquement)
    if (invite && !isFlowMode && invite.status === "completed") {
      throw new SubmitSubmissionError(
        "INVITE_ALREADY_USED",
        "Cette invitation a déjà été utilisée."
      );
    }

    // 4) Validation spécifique TEST SEUL
    if (invite && !isFlowMode) {
      if (!invite.submissionId || invite.submissionId !== submissionId) {
        throw new SubmitSubmissionError(
          "SUBMISSION_NOT_LINKED_TO_INVITE",
          "Invitation introuvable ou non liée à cette submission. Le lien a peut-être expiré."
        );
      }
    }

    // 5) Validation spécifique FLOW
    let flowData: Awaited<ReturnType<TestFlowRepo["getFlowByOffer"]>> | null =
      null;

    if (isFlowMode && invite) {
      const candidate = await candidateRepo.getById(orgId, invite.candidateId);
      if (!candidate?.offerId) {
        throw new SubmitSubmissionError(
          "CANDIDATE_WITHOUT_OFFER",
          "Candidat sans offre associée."
        );
      }

      flowData = await flowRepo.getFlowByOffer({
        orgId,
        offerId: candidate.offerId,
      });

      if (!flowData) {
        throw new SubmitSubmissionError(
          "FLOW_NOT_FOUND",
          "Parcours introuvable."
        );
      }

      const allowedFlowItemIds = new Set(flowData.items.map((it) => it.id));
      if (
        !submission.flowItemId ||
        !allowedFlowItemIds.has(submission.flowItemId)
      ) {
        throw new SubmitSubmissionError(
          "SUBMISSION_NOT_IN_FLOW",
          "Cette submission ne fait pas partie du parcours."
        );
      }
    }

    // 6) Questions autorisées pour CETTE submission
    const allowed = await testRepo.getSubmissionQuestionsWithDisplayIndex({
      orgId,
      submissionId,
    });

    const allowedQuestionIds = new Set(allowed.map((q) => q.id));

    // Validation : toutes les questions répondues doivent être dans le test
    for (const a of answers) {
      if (!allowedQuestionIds.has(a.questionId)) {
        throw new SubmitSubmissionError(
          "INVALID_QUESTION",
          "Réponse invalide : une ou plusieurs questions ne font pas partie de ce test."
        );
      }
    }

    // Validation : pas de doublons
    const unique = new Set<string>();
    for (const a of answers) {
      if (unique.has(a.questionId)) {
        throw new SubmitSubmissionError(
          "DUPLICATE_QUESTION",
          "Réponse invalide : une question a été répondue plusieurs fois."
        );
      }
      unique.add(a.questionId);
    }

    // Validation : toutes les questions obligatoires sont répondues
    const requiredQuestionIds = new Set(
      allowed.filter((q) => q.isRequired).map((q) => q.id)
    );

    for (const rq of requiredQuestionIds) {
      if (!unique.has(rq)) {
        throw new SubmitSubmissionError(
          "MISSING_REQUIRED_QUESTION",
          "Certaines questions obligatoires n'ont pas été répondues. Merci de compléter le test."
        );
      }
    }

    // 7) Récupérer test + questions pour le scoring
    const testWithQuestions = await testRepo.getTestWithQuestionsAnyOrg(submission.testId, orgId);

    if (!testWithQuestions) {
      throw new SubmitSubmissionError(
        "TEST_NOT_FOUND",
        "Test associé introuvable."
      );
    }

    const { test, questions } = testWithQuestions;

    // 8) Protection "déjà complété"
    if (submission.completedAt) {
      throw new SubmitSubmissionError(
        "SUBMISSION_ALREADY_COMPLETED",
        "Ce test a déjà été complété."
      );
    }

    // 9) Scoring uniquement pour les tests de motivations (v2.5)
    let numericScore: number | undefined;
    let maxScore: number | undefined;
    let scoringResult: MotivationScoringResult | null | undefined;

    if (test.type === "motivations") {
      const scoring = computeMotivationScoring({
        test,
        questions,
        answers,
      });

      numericScore = scoring.numericScore ?? undefined;
      maxScore = scoring.maxScore ?? undefined;
      scoringResult = scoring.scoringResult ?? null;
    }

    // 10) Persister les réponses + éventuel score + scoring_result
    const result = await testRepo.submitAnswers({
      orgId,
      submissionId,
      answers,
      numericScore,
      maxScore,
      scoringResult // ✅ nouveau champ (jsonb) sur submission
    });

    // 11) Marquer l'invitation comme complétée (si fournie)
    if (invite) {
      if (!isFlowMode) {
        await inviteRepo.markCompleted({ inviteId: invite.id });
      } else {
        const testItemIds = flowData!.items
          .filter((it) => it.kind === "test")
          .map((it) => it.id);

        const isFlowCompleted = await testRepo.areAllFlowTestsCompleted({
          orgId,
          candidateId: invite.candidateId,
          testFlowItemIds: testItemIds,
        });

        if (isFlowCompleted) {
          await inviteRepo.markCompleted({ inviteId: invite.id });
        }
      }
    }

    // 12) Mettre à jour le statut du candidat
    if (submission.candidateId) {
      await candidateRepo.updateCandidateStatus({
        orgId,
        candidateId: submission.candidateId,
        status: "screening",
      });
    }

    return result;
  };
}
