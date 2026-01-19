// core/usecases/tests/startFlowFromInvite.ts
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";
import type { Test, TestQuestion, TestSubmission } from "@/core/models/Test";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type { TestRepo } from "@/core/ports/TestRepo";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";
import { StartSubmissionError } from "../submissions/startSubmissionFromInvite";

function shuffleQuestions(questions: TestQuestion[]): TestQuestion[] {
  const arr = [...questions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type FlowItemWithContent = TestFlowItem & {
  questions?: (TestQuestion & { displayIndex: number })[];
  test?: Test;
  submission?: TestSubmission;
};

export type StartFlowFromInviteResult = {
  flow: TestFlow;
  items: FlowItemWithContent[];
  currentItemIndex: number;
  currentItem: FlowItemWithContent;
};

export function makeStartFlowFromInvite(deps: {
  testRepo: TestRepo;
  inviteRepo: TestInviteRepo;
  flowRepo: TestFlowRepo;
  candidateRepo: CandidateRepo;
}) {
  const { testRepo, inviteRepo, flowRepo, candidateRepo } = deps;

  async function ensureSubmissionItemsSeeded(params: {
    orgId: string;
    submissionId: string;
    questionsWithDisplayIndex: (TestQuestion & { displayIndex: number })[];
  }): Promise<(TestQuestion & { displayIndex: number })[]> {
    const { orgId, submissionId, questionsWithDisplayIndex } = params;

    const existingQuestions = await testRepo.getSubmissionQuestionsWithDisplayIndex({
      orgId,
      submissionId,
    });

    if (existingQuestions.length > 0) return existingQuestions;

    // ✅ Si vide => on seed (idempotence côté DB recommandée, mais même sans ça on ne fait ça qu'en fallback)
    await testRepo.createSubmissionItems({
      orgId,
      submissionId,
      items: questionsWithDisplayIndex.map((q) => ({
        questionId: q.id,
        displayIndex: q.displayIndex,
      })),
    });

    const seeded = await testRepo.getSubmissionQuestionsWithDisplayIndex({
      orgId,
      submissionId,
    });

    return seeded.length > 0 ? seeded : questionsWithDisplayIndex;
  }

  return async function startFlowFromInvite(input: {
    orgId: string;
    inviteToken: string;
    startedBy?: string | null;
  }): Promise<StartFlowFromInviteResult> {
    const { orgId, inviteToken, startedBy } = input;
    const now = new Date();

    // 1) Récupérer l'invite
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
      throw new StartSubmissionError("INVITE_REVOKED", "Cette invitation a été révoquée.");
    }

    if (invite.status === "completed") {
      throw new StartSubmissionError("INVITE_COMPLETED", "Ce test a déjà été complété.");
    }

    const expires = new Date(invite.expiresAt);
    if (expires.getTime() < now.getTime()) {
      throw new StartSubmissionError("INVITE_EXPIRED", "Cette invitation a expiré.");
    }

    // 2) Vérifier que l'invite a un flowItemId
    if (!invite.flowItemId) {
      throw new StartSubmissionError(
        "INVITE_NOT_FOUND",
        "Cette invitation n'est pas liée à un parcours de test."
      );
    }

    // 3) Récupérer le candidat pour obtenir son offerId
    const candidate = await candidateRepo.getById(orgId, invite.candidateId);
    if (!candidate || !candidate.offerId) {
      throw new StartSubmissionError(
        "INVITE_NOT_FOUND",
        "Le candidat n'a pas d'offre associée."
      );
    }

    // 4) Récupérer le flow complet
    const flowData = await flowRepo.getFlowByOffer({
      orgId,
      offerId: candidate.offerId,
    });

    if (!flowData) {
      throw new StartSubmissionError(
        "INVITE_NOT_FOUND",
        "Le parcours de test n'existe plus."
      );
    }

    const flowId = flowData.flow.id;

    // 5) Enrichir les items
    const enrichedItems: FlowItemWithContent[] = await Promise.all(
      flowData.items.map(async (item: TestFlowItem) => {
        // Item non-test : passthrough
        if (item.kind !== "test" || !item.testId) {
          return item as FlowItemWithContent;
        }

        // ✅ IMPORTANT : charger via ANY ORG (catalogue Blueberry accessible)
        const testWithQuestions = await testRepo.getTestWithQuestionsAnyOrg(
          item.testId,
          orgId
        );

        if (!testWithQuestions) {
          // on renvoie l'item mais il sera bloqué par les guard rails plus bas
          return {
            ...item,
            questions: [],
          } as FlowItemWithContent;
        }

        // Préparer un ordre random (fallback uniquement)
        const shuffled = shuffleQuestions(testWithQuestions.questions);
        let questionsWithDisplayIndex: (TestQuestion & { displayIndex: number })[] =
          shuffled.map((q, index) => ({ ...q, displayIndex: index + 1 }));

        let submission: TestSubmission | undefined;

        // ✅ 1) Si une submission existe déjà pour ce candidate + flowItem => on la réutilise
        const existing = await testRepo.getSubmissionByCandidateAndFlowItem({
          orgId,
          candidateId: invite.candidateId,
          flowItemId: item.id,
        });

        if (existing) {
          submission = existing;

          // ✅ ensure seed si submission_items manquent
          questionsWithDisplayIndex = await ensureSubmissionItemsSeeded({
            orgId,
            submissionId: submission.id,
            questionsWithDisplayIndex,
          });
        } else if (item.id === invite.flowItemId && invite.submissionId) {
          // ✅ 2) Cas legacy / sécurité : l’invite pointe déjà une submissionId
          try {
            const aggregate = await testRepo.getSubmissionWithAnswers({
              submissionId: invite.submissionId,
              orgId,
            });
            submission = aggregate.submission;

            // ✅ ensure seed si submission_items manquent
            questionsWithDisplayIndex = await ensureSubmissionItemsSeeded({
              orgId,
              submissionId: invite.submissionId,
              questionsWithDisplayIndex,
            });
          } catch {
            submission = undefined;
          }
        }

        // ✅ 3) Si toujours pas de submission => on en crée une propre
        if (!submission) {
          submission = await testRepo.startSubmission({
            orgId,
            testId: item.testId,
            candidateId: invite.candidateId,
            offerId: candidate.offerId ?? undefined,
            submittedBy: startedBy ?? undefined,
            flowId,
            flowItemId: item.id,
          });

          await testRepo.createSubmissionItems({
            orgId,
            submissionId: submission.id,
            items: questionsWithDisplayIndex.map((q) => ({
              questionId: q.id,
              displayIndex: q.displayIndex,
            })),
          });

          // Lier la submission à l'invitation seulement pour l'item de l'invitation
          if (item.id === invite.flowItemId) {
            await inviteRepo.linkSubmission({
              inviteId: invite.id,
              submissionId: submission.id,
            });
          }
        }

        return {
          ...item,
          test: testWithQuestions.test,
          questions: questionsWithDisplayIndex,
          submission,
        } as FlowItemWithContent;
      })
    );

    // 6) Vérifier que l’item de l’invite existe
    const invitedItemIndex = enrichedItems.findIndex((it) => it.id === invite.flowItemId);
    if (invitedItemIndex === -1) {
      throw new StartSubmissionError(
        "INVITE_NOT_FOUND",
        "L'élément du parcours associé à cette invitation n'existe plus."
      );
    }

    // 7) Le candidat commence par le premier item
    const currentItemIndex = 0;
    const currentItem = enrichedItems[currentItemIndex];

    // 8) Guard rails : si item courant = test, vérifier actif + questions + submission
    if (currentItem.kind === "test") {
      if (!currentItem.test) {
        throw new StartSubmissionError(
          "TEST_NOT_FOUND",
          "Le test associé à cette étape est introuvable."
        );
      }
      if (!currentItem.test.isActive) {
        throw new StartSubmissionError(
          "TEST_INACTIVE",
          "Le test associé à cette invitation est désactivé."
        );
      }
      if (!currentItem.questions || currentItem.questions.length === 0) {
        throw new StartSubmissionError(
          "NO_QUESTIONS",
          "Aucune question n'est configurée pour ce test."
        );
      }
      if (!currentItem.submission) {
        throw new StartSubmissionError(
          "NO_TEST_SUBMISSION",
          "Impossible de démarrer la submission pour ce test."
        );
      }
    }

    return {
      flow: flowData.flow,
      items: enrichedItems,
      currentItemIndex,
      currentItem,
    };
  };
}
