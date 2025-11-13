import type { SupabaseClient } from "@supabase/supabase-js";
// import type { CandidateRepo } from "@/core/ports/CandidateRepo";

export function makeCandidateRepo(sb: SupabaseClient) {
  return {
    async listByOrg(orgId: string) {
      const { data, error } = await sb
        .from("candidates")
        .select("id, full_name, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  };
}
