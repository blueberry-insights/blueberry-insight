import type { OrgRole, OrgMember } from "@/core/models/Membership";

export interface MembershipRepo {
  hasAnyForUser(userId: string): Promise<boolean>;
  add(userId: string, orgId: string, role: OrgRole): Promise<void>;
  
  /**
   * Récupérer le rôle d'un utilisateur dans une organisation
   */
  getUserRole(userId: string, orgId: string): Promise<OrgRole | null>;
  
  /**
   * Lister les membres d'une organisation avec leurs infos
   */
  listMembersForOrg(orgId: string): Promise<OrgMember[]>;
  
  /**
   * Vérifier si un utilisateur est déjà membre d'une org
   */
  isMember(userId: string, orgId: string): Promise<boolean>;
}
