import type { OrgRole, OrgMember } from "@/core/models/Membership";

export interface MembershipRepo {
  hasAnyForUser(userId: string): Promise<boolean>;
  add(userId: string, orgId: string, role: OrgRole): Promise<void>;
  getUserRole(userId: string, orgId: string): Promise<OrgRole | null>;
  listMembersForOrg(orgId: string): Promise<OrgMember[]>;
  isMember(userId: string, orgId: string): Promise<boolean>;
  listForUser(userId: string): Promise<Array<{ orgId: string; role: OrgRole; createdAt: string }>>;
}
