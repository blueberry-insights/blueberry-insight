import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";
import type { OfferRepo, CreateOfferInput, UpdateOfferInput } from "@/core/ports/OfferRepo";
import type { Offer, OfferListItem, OfferStatus } from "@/core/models/Offer";

type Db = SupabaseClient<Database>;

export function makeOfferRepo(sb: Db): OfferRepo {
  return {
    async listByOrg(orgId: string): Promise<OfferListItem[]> {
      const { data, error } = await sb
        .from("offers")
        .select("id, title, description, status")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        status: row.status as OfferListItem["status"],
      }));
    },

    async getById(orgId: string, offerId: string): Promise<Offer | null> {
      const { data, error } = await sb
        .from("offers")
        .select("id, org_id, title, description, status, created_at")
        .eq("org_id", orgId)
        .eq("id", offerId)
        .single();

      if (error) return null;

      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
      };
    },

    async create(input: CreateOfferInput): Promise<Offer> {
      const { orgId, title, description, status = "draft" } = input;

      const { data, error } = await sb
        .from("offers")
        .insert({
          org_id: orgId,
          title,
          description: description ?? null,
          status,
        })
        .select("id, org_id, title, description, status, created_at")
        .single();

      if (error || !data) throw error ?? new Error("Insert failed");

      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
      };
    },

    async update(input: UpdateOfferInput): Promise<Offer> {
      const { orgId, offerId, ...fields } = input;

      const { data, error } = await sb
        .from("offers")
        .update({
          ...fields,
        })
        .eq("org_id", orgId)
        .eq("id", offerId)
        .select("id, org_id, title, description, status, created_at")
        .single();

      if (error || !data) throw error ?? new Error("Update failed");

      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
      };
    },
  };
}
