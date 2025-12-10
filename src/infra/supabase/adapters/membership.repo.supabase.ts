// infra/supabase/repos/membership.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRepo } from "@/core/ports/MembershipRepo";
import type { OrgRole, OrgMember } from "@/core/models/Membership";
import { supabaseAdmin } from "@/infra/supabase/client";

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
    
    async add(userId: string, orgId: string, role: OrgRole) {
      const { error } = await sb
        .from("user_organizations")
        .insert([{ user_id: userId, org_id: orgId, role }]);
      if (error) throw error;
    },
    
    async getUserRole(userId: string, orgId: string): Promise<OrgRole | null> {
      const { data, error } = await sb
        .from("user_organizations")
        .select("role")
        .eq("user_id", userId)
        .eq("org_id", orgId)
        .single();
      if (error) return null;
      return (data?.role as OrgRole) ?? null;
    },
    
    async listMembersForOrg(orgId: string): Promise<OrgMember[]> {
      const { data, error } = await sb
        .from("user_organizations")
        .select("user_id, org_id, role, created_at")
        .eq("org_id", orgId);
      
      if (error) throw error;
      if (!data?.length) return [];
      
      // Récupérer les infos des utilisateurs
      const adminClient = supabaseAdmin();
      const members = await Promise.all(
        data.map(async (row) => {
          try {
            const { data: userData } = await adminClient.auth.admin.getUserById(row.user_id);
            return {
              userId: row.user_id,
              orgId: row.org_id,
              role: row.role as OrgRole,
              createdAt: row.created_at,
              email: userData?.user?.email,
              fullName: userData?.user?.user_metadata?.full_name,
            };
          } catch {
            return {
              userId: row.user_id,
              orgId: row.org_id,
              role: row.role as OrgRole,
              createdAt: row.created_at,
            };
          }
        })
      );
      
      return members;
    },
    
    async isMember(userId: string, orgId: string): Promise<boolean> {
      const { data, error } = await sb
        .from("user_organizations")
        .select("user_id")
        .eq("user_id", userId)
        .eq("org_id", orgId)
        .limit(1);
      if (error) return false;
      return !!data?.length;
    },
  };
}
