// core/usecases/tests/listCandidateInvites.ts
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type { TestRepo } from "@/core/ports/TestRepo";
import type { TestInvite } from "@/core/models/Test";

export type CandidateInviteView = {
  invite: TestInvite;
  testName: string;
};

export function makeListCandidateInvites(deps: {
  inviteRepo: TestInviteRepo;
  testRepo: TestRepo;
}) {
  const { inviteRepo, testRepo } = deps;

  return async function listCandidateInvites(input: {
    orgId: string;
    candidateId: string;
  }): Promise<CandidateInviteView[]> {
    const { orgId, candidateId } = input;

    const invites = await inviteRepo.listByCandidate({ orgId, candidateId });

    const testIds = Array.from(new Set(invites.map((i) => i.testId)));

    // V1 simple : on boucle, c’est ok pour un MVP
    const testsById = new Map<string, { name: string }>();
    for (const testId of testIds) {
      const test = await testRepo.getTestById(testId, orgId);
      if (test) testsById.set(testId, { name: test.name });
    }

    return invites.map((inv) => ({
      invite: inv,
      testName: testsById.get(inv.testId)?.name ?? "Test supprimé",
    }));
  };
}
