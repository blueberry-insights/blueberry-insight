// infra/supabase/adapters/testFlow.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/Database";
import type { TestFlowRepo, AddFlowItemInput, CreateTestFlowInput } from "@/core/ports/TestFlowRepo";
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
    async addItem(input: AddFlowItemInput): Promise<TestFlowItem> {
      const base = {
        org_id: input.orgId,
        flow_id: input.flowId,
        order_index: input.orderIndex,
        kind: input.kind,
        title: input.title ?? null,
        description: input.description ?? null,
        is_required: input.isRequired ?? true,
      };

      const payload =
        input.kind === "video"
          ? { ...base, video_url: input.videoUrl, test_id: null }
          : { ...base, test_id: input.testId, video_url: null };

      const { data, error } = await supabase
        .from("test_flow_items")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) throw error ?? new Error("Insert failed");

      return {
        id: data.id,
        orgId: data.org_id,
        flowId: data.flow_id,
        orderIndex: data.order_index,
        kind: mapFlowItemKind(data.kind),
        testId: data.test_id ?? undefined,
        videoUrl: data.video_url ?? undefined,
        title: data.title ?? null,
        description: data.description ?? null,
        isRequired: data.is_required ?? null,
        createdAt: data.created_at ?? null,
      };
    },

    async deleteItem({ orgId, itemId }) {
      const { error } = await supabase
        .from("test_flow_items")
        .delete()
        .eq("org_id", orgId)
        .eq("id", itemId);

      if (error) throw error;
    },

    async reorderItems({ orgId, flowId, items }) {
      for (const it of items) {
        const { error } = await supabase
          .from("test_flow_items")
          .update({ order_index: it.orderIndex })
          .eq("org_id", orgId)
          .eq("flow_id", flowId)
          .eq("id", it.id);

        if (error) throw error;
      }
    },

    async createFlow(input: CreateTestFlowInput) {
      const { data, error } = await supabase
        .from("test_flows")
        .insert({
          org_id: input.orgId,
          offer_id: input.offerId,
          name: input.name ?? "Parcours par défaut",
          is_active: true,
          created_by: input.createdBy,
        })
        .select("*")
        .single();

      if (error || !data) throw error ?? new Error("Create flow failed");

      return {
        id: data.id,
        orgId: data.org_id,
        offerId: data.offer_id,
        name: data.name,
        createdAt: data.created_at,
      };
    },
  };
}


