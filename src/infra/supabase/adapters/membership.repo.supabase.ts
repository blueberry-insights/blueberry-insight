// infra/supabase/repos/membership.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRepo, Role } from "@/core/ports/MembershipRepo";

export function makeMembershipRepo(sb: SupabaseClient): MembershipRepo {
  return {
    async hasAnyForUser(userId: string) {
      const { data, error } = await sb
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", userId)
        .limit(1);
      if (error) throw error;
      return !!data?.length;
    },
    async add(userId: string, orgId: string, role: Role) {
      const { error } = await sb
        .from("user_organizations")
        .insert([{ user_id: userId, org_id: orgId, role }]);
      if (error) throw error;
    },
  };
}
