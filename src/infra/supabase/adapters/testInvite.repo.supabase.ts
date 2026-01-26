import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../types/Database";
import type { TestInviteRepo } from "@/core/ports/TestInviteRepo";
import type {
  CreateTestInviteInput,
  LinkSubmissionToInviteInput,
  MarkInviteCompletedInput,
} from "@/core/ports/TestInviteRepo";
import { logger } from "@/shared/utils/logger";

import type { TestInvite } from "@/core/models/Test";

type Db = SupabaseClient<Database>;

function mapInviteRow(row: Tables<"test_invites">): TestInvite {
  return {
    id: row.id,
    orgId: row.org_id,
    candidateId: row.candidate_id,
    testId: row.test_id,
    flowItemId: row.flow_item_id ?? null,
    token: row.token,
    status: row.status as TestInvite["status"],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? null,
    completedAt: row.completed_at ?? null,
    submissionId: row.submission_id ?? null,
  };
}

export function makeTestInviteRepo(sb: Db): TestInviteRepo {
  return {
    async createInvite(input: CreateTestInviteInput): Promise<TestInvite> {
      const insert: TablesInsert<"test_invites"> = {
        org_id: input.orgId,
        candidate_id: input.candidateId,
        test_id: input.testId,
        flow_item_id: input.flowItemId ?? null,
        token: input.token,
        status: "pending",
        expires_at: input.expiresAt,
      };

      const { data, error } = await sb
        .from("test_invites")
        .insert(insert)
        .select("*")
        .single();

      if (error || !data) {
        logger.error("[TestInviteRepo.createInvite] error", undefined, error);
        throw error ?? new Error("Failed to create test invite");
      }

      return mapInviteRow(data);
    },

    async getByToken(token: string): Promise<TestInvite | null> {
      const { data, error } = await sb
        .from("test_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error) {
        logger.error("[TestInviteRepo.getByToken] error", undefined, error);
        throw error;
      }
      if (!data) return null;
      const invite = mapInviteRow(data);
      // ✅ Log sécurisé : flowItemId sera automatiquement masqué (UUID)
      logger.debug("[TestInviteRepo.getByToken] invite récupérée", { flowItemId: invite.flowItemId });
      return invite;
    },

    async linkSubmission(input: LinkSubmissionToInviteInput): Promise<void> {
      const patch: TablesUpdate<"test_invites"> = {
        submission_id: input.submissionId,
      };

      const { error } = await sb
        .from("test_invites")
        .update(patch)
        .eq("id", input.inviteId);

      if (error) {
        logger.error("[TestInviteRepo.linkSubmission] error", undefined, error);
        throw error;
      }
    },

    async markCompleted(input: MarkInviteCompletedInput): Promise<void> {
      const patch: TablesUpdate<"test_invites"> = {
        status: "completed",
        completed_at: input.completedAt ?? new Date().toISOString(),
      };

      const { error } = await sb
        .from("test_invites")
        .update(patch)
        .eq("id", input.inviteId);

      if (error) {
        logger.error("[TestInviteRepo.markCompleted] error", undefined, error);
        throw error;
      }
    },

    async listByCandidate({ orgId, candidateId }): Promise<TestInvite[]> {
      const { data, error } = await sb
        .from("test_invites")
        .select("*")
        .eq("org_id", orgId)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapInviteRow);
    },
  };
}
