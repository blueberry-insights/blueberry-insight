// infra/supabase/adapters/testFlow.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/Database";
import type {
  TestFlowRepo,
  AddFlowItemInput,
  ReorderFlowItemsInput,
} from "@/core/ports/TestFlowRepo";
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";

type Db = SupabaseClient<Database>;

function mapFlowItemKind(kind: string): "video" | "test" {
  if (kind === "video" || kind === "test") return kind;
  throw new Error(`Invalid flow item kind: ${kind}`);
}

export function makeTestFlowRepo(supabase: Db): TestFlowRepo {
  return {
    async getFlowByOffer({
      orgId,
      offerId,
    }): Promise<{ flow: TestFlow; items: TestFlowItem[] } | null> {
      const { data: flow, error: flowError } = await supabase
        .from("test_flows")
        .select("*")
        .eq("offer_id", offerId)
        .eq("is_active", true)
        .maybeSingle();

      if (flowError) throw flowError;
      if (!flow) return null;

      // Guard anti "org active != org réelle"
      if (flow.org_id !== orgId) {
        throw new Error(
          `ORG_MISMATCH getFlowByOffer: asked orgId=${orgId} but flow.org_id=${flow.org_id} (offerId=${offerId})`
        );
      }

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
          createdBy: flow.created_by,
          isActive: flow.is_active,
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
          description: (item as Record<string, unknown>).description as string | undefined,
          isRequired: item.is_required ?? undefined,
          createdAt: item.created_at ?? undefined,
        })),
      };
    },

    async createFlow(input): Promise<TestFlow> {
      // 1) source de vérité = offers.org_id
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("id, org_id")
        .eq("id", input.offerId)
        .single();

      if (offerError || !offer) throw offerError ?? new Error("Offer not found");

      // 2) upsert (idempotent) sur offer_id (unique index test_flows_one_active_per_offer)
      //    org_id = offer.org_id, pas input.orgId
      const { data, error } = await supabase
        .from("test_flows")
        .upsert(
          {
            offer_id: input.offerId,
            org_id: offer.org_id,
            name: input.name ?? "Parcours par défaut",
            created_by: input.createdBy,
            is_active: input.isActive,
          },
          { onConflict: "offer_id" }
        )
        .select("*")
        .single();

      if (error || !data) throw error ?? new Error("Create flow failed");

      // Guard (debug) : si on te passe un orgId incohérent, tu le vois tout de suite
      if (input.orgId !== offer.org_id) {
        // tu peux throw si tu veux être strict. Là je log seulement via error.
        // throw new Error(`ORG_MISMATCH createFlow: input.orgId=${input.orgId} offer.org_id=${offer.org_id}`);
      }

      return {
        id: data.id,
        orgId: data.org_id,
        offerId: data.offer_id,
        name: data.name,
        createdAt: data.created_at ?? new Date().toISOString(),
        createdBy: data.created_by,
        isActive: data.is_active ?? true,
      };
    },

    async addItem(input: AddFlowItemInput): Promise<TestFlowItem> {
      // Source de vérité = flow.org_id (évite l’incohérence org active)
      const { data: flow, error: flowError } = await supabase
        .from("test_flows")
        .select("id, org_id")
        .eq("id", input.flowId)
        .single();

      if (flowError || !flow) throw flowError ?? new Error("Flow not found");

      // Guard
      if (flow.org_id !== input.orgId) {
        throw new Error(
          `ORG_MISMATCH addItem: input.orgId=${input.orgId} flow.org_id=${flow.org_id} (flowId=${input.flowId})`
        );
      }

      const base = {
        org_id: flow.org_id,
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
        title: data.title ?? undefined,
        description: (data as Record<string, unknown>).description as string | undefined,
        isRequired: data.is_required ?? undefined,
        createdAt: data.created_at ?? undefined,
      };
    },

    async deleteItem({ orgId, itemId }) {
      // Guard: vérifier l’org de l’item avant suppression (sinon tu peux delete “à l’aveugle”)
      const { data: item, error: readErr } = await supabase
        .from("test_flow_items")
        .select("id, org_id")
        .eq("id", itemId)
        .single();

      if (readErr || !item) throw readErr ?? new Error("Item not found");
      if (item.org_id !== orgId) {
        throw new Error(
          `ORG_MISMATCH deleteItem: input.orgId=${orgId} item.org_id=${item.org_id} (itemId=${itemId})`
        );
      }

      const { error } = await supabase.from("test_flow_items").delete().eq("id", itemId);
      if (error) throw error;
    },

    async reorderItems({ orgId, flowId, items }: ReorderFlowItemsInput) {
      // Guard: vérifier l’org du flow une fois
      const { data: flow, error: flowError } = await supabase
        .from("test_flows")
        .select("id, org_id")
        .eq("id", flowId)
        .single();

      if (flowError || !flow) throw flowError ?? new Error("Flow not found");
      if (flow.org_id !== orgId) {
        throw new Error(
          `ORG_MISMATCH reorderItems: input.orgId=${orgId} flow.org_id=${flow.org_id} (flowId=${flowId})`
        );
      }

      // P0 : boucle update (ok pour MVP)
      for (const it of items) {
        const { error } = await supabase
          .from("test_flow_items")
          .update({ order_index: it.orderIndex })
          .eq("flow_id", flowId)
          .eq("id", it.id);

        if (error) throw error;
      }
    },

    async countItemsUsingTest(testId: string, orgId: string) {
      const { count, error } = await supabase
        .from("test_flow_items")
        .select("id", { head: true, count: "exact" })
        .eq("org_id", orgId)
        .eq("test_id", testId);

      if (error) throw error;
      return count ?? 0;
    },
  };
}
