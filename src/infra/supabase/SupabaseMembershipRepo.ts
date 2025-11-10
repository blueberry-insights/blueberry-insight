import type { MembershipRepo, Role } from "@/core/ports/MembershipRepo";
import { supabaseServer } from "./server";

export const SupabaseMembershipRepo: MembershipRepo = {
  async hasAnyForUser(userId) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("user_organizations").select("org_id").eq("user_id", userId).limit(1);
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
  async add(userId, orgId, role: Role) {
    const sb = await supabaseServer();
    const { error } = await sb.from("user_organizations").insert({ user_id: userId, org_id: orgId, role });
    if (error) throw error;
  },
};
