// infra/supabase/adapters/testFlow.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/Database";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";

type Db = SupabaseClient<Database>;

function mapFlowItemKind(kind: string): "video" | "test" {
    if (kind === "video" || kind === "test") {
      return kind;
    }
    throw new Error(`Invalid flow item kind: ${kind}`);
  }

export function makeTestFlowRepo(
  supabase: Db
): TestFlowRepo {
  return {
    async getFlowByOffer({ orgId, offerId }): Promise<{ flow: TestFlow; items: TestFlowItem[] } | null> {
      const { data: flow, error: flowError } = await supabase
        .from("test_flows")
        .select("*")
        .eq("org_id", orgId)
        .eq("offer_id", offerId)
        .eq("is_active", true)
        .maybeSingle();

      if (flowError) throw flowError;
      if (!flow) return null;

      const { data: items, error: itemsError } = await supabase
        .from("test_flow_items")
        .select("*")
        .eq("flow_id", flow.id)
        .order("order_index", { ascending: true });

      if (itemsError) throw itemsError;

      return {
        flow: {
          id: flow.id,
          orgId: flow.org_id,
          offerId: flow.offer_id,
          name: flow.name,
          createdAt: flow.created_at,
        },
        items: (items ?? []).map((item): TestFlowItem => ({
          id: item.id,
          flowId: item.flow_id,
          orderIndex: item.order_index,
          kind: mapFlowItemKind(item.kind),
          orgId: item.org_id,
          testId: item.test_id ?? undefined,
          videoUrl: item.video_url ?? undefined,
          title: item.title ?? undefined,
          isRequired: item.is_required ?? undefined,
          createdAt: item.created_at ?? undefined,
        })),
      };
    },
    async createFlow() {
        throw new Error("Not implemented");
      },
  
      async addItem() {
        throw new Error("Not implemented");
      },
  
      async reorderItems() {
        throw new Error("Not implemented");
      },
  
      async deleteItem() {
        throw new Error("Not implemented");
      },
  };
}
