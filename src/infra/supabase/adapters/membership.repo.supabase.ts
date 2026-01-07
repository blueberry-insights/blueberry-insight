// infra/supabase/repos/membership.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRepo } from "@/core/ports/MembershipRepo";
import type { OrgRole, OrgMember } from "@/core/models/Membership";

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
      
      // Le repo ne récupère plus les infos utilisateur ici.
      // Cette logique doit être faite dans les actions/pages via getUserInfo().
      // Cela évite d'utiliser supabaseAdmin() dans le repo.
      const members = data.map((row) => ({
        userId: row.user_id,
        orgId: row.org_id,
        role: row.role as OrgRole,
        createdAt: row.created_at,
        email: null, // Sera enrichi dans les actions/pages si nécessaire
        fullName: null, // Sera enrichi dans les actions/pages si nécessaire
      }));
      
      return members as unknown as OrgMember[];
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
