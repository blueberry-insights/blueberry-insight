import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";
import type { OfferRepo } from "@/core/ports/OfferRepo";
import type { OfferListItem } from "@/core/models/Offer";

type Db = SupabaseClient<Database>;

export function makeOfferRepo(sb: Db): OfferRepo {
  return {
    async listByOrg(orgId: string): Promise<OfferListItem[]> {
      const { data, error } = await sb
        .from("offers")
        .select("id, title")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
  };
}
