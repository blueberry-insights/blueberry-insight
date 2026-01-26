// core/usecases/tests/sendTestInviteForCandidate.ts
import crypto from "crypto";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type { TestInvite } from "@/core/models/Test";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";
import { logger } from "@/shared/utils/logger";

export function makeSendTestInviteForCandidate(deps: {
  inviteRepo: TestInviteRepo;
  candidateRepo: CandidateRepo;
}) {
  const { inviteRepo, candidateRepo } = deps;

  return async function sendTestInviteForCandidate(input: {
    orgId: string;
    candidateId: string;
    testId: string;
    expiresInHours: number;
    flowItemId?: string | null;
  }): Promise<{ invite: TestInvite }> {
    const { orgId, candidateId, testId, expiresInHours, flowItemId } = input;

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + expiresInHours * 60 * 60 * 1000
    ).toISOString();

    const token = crypto.randomBytes(24).toString("base64url");
    const existing = await inviteRepo.listByCandidate({
      orgId,
      candidateId,
    });

    const active = existing.find(
      (inv) =>
        inv.testId === testId &&
        inv.status !== "completed" &&
        new Date(inv.expiresAt) > new Date()
    );
    
    // Si une invitation active existe, vérifier si elle a le même flowItemId
    // Si elle n'a pas de flowItemId alors qu'on en a un maintenant, créer une nouvelle invitation
    if (active) {
      // Si les flowItemId correspondent (tous les deux null ou tous les deux égaux), réutiliser l'invitation
      const flowItemIdsMatch = 
        (!active.flowItemId && !flowItemId) || 
        (active.flowItemId === flowItemId);
      
      if (flowItemIdsMatch) {
        // Mettre à jour le statut du candidat à "test" même si l'invitation existe déjà
        const candidate = await candidateRepo.getById(orgId, candidateId);
        if (candidate && candidate.status !== "test") {
          await candidateRepo.update({
            orgId,
            candidateId,
            fullName: candidate.fullName,
            email: candidate.email ?? "",
            phone: candidate.phone,
            location: candidate.location,
            status: "test",
            source: candidate.source,
            tags: candidate.tags,
            note: candidate.note,
            offerId: candidate.offerId,
          });
        }
        return { invite: active };
      }
      // Si les flowItemId ne correspondent pas, on continue pour créer une nouvelle invitation
    }
      // ✅ Log sécurisé : flowItemId sera automatiquement masqué (UUID)
      logger.debug("[sendTestInviteForCandidate] Création d'une nouvelle invitation", { flowItemId });
    const invite = await inviteRepo.createInvite({
      orgId,
      candidateId,
      testId,
      flowItemId: flowItemId ?? undefined,
      expiresAt,
      token, 
    });
      // ✅ Log sécurisé : flowItemId sera automatiquement masqué (UUID)
      logger.debug("[sendTestInviteForCandidate] Invitation créée", { flowItemId: invite.flowItemId });

    // Mettre à jour le statut du candidat à "test" après la création de l'invitation
    const candidate = await candidateRepo.getById(orgId, candidateId);
    if (candidate && candidate.status !== "test") {
      await candidateRepo.update({
        orgId,
        candidateId,
        fullName: candidate.fullName,
        email: candidate.email ?? "",
        phone: candidate.phone,
        location: candidate.location,
        status: "test",
        source: candidate.source,
        tags: candidate.tags,
        note: candidate.note,
        offerId: candidate.offerId,
      });
    }

    return { invite };
  };
}
