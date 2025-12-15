"use server";

import { withAuth } from "@/infra/supabase/session";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeGetOfferTestFlowWithQuestions } from "@/core/usecases/tests/getOfferTestFlowWithQuestions";
import type { TestFlow ,TestFlowItem } from "@/core/models/TestFlow";

type Ok = { ok: true; data: { flow: TestFlow; items: TestFlowItem[] } | null };
type Err = { ok: false; error: string };

export async function getOfferTestFlowAction(
  offerId: string
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    try {
      const flowRepo = makeTestFlowRepo(ctx.sb);
      const testRepo = makeTestRepo(ctx.sb);
      const getFlow = makeGetOfferTestFlowWithQuestions(flowRepo, testRepo);

      const data = await getFlow({ orgId: ctx.orgId, offerId });
      return { ok: true, data };
    } catch (err) {
      console.error("[getOfferTestFlowAction] error:", err);
      return { ok: false, error: "Erreur lors du chargement du flow de tests" };
    }
  });
}
