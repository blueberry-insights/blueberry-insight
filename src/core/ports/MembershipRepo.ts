export type Role = "owner" | "recruiter" | "viewer";
export interface MembershipRepo {
  hasAnyForUser(userId: string): Promise<boolean>;
  add(userId: string, orgId: string, role: Role): Promise<void>;
}
