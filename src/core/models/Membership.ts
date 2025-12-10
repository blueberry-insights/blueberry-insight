export const orgRoleValues = ["owner", "admin", "recruiter", "viewer"] as const;
export type OrgRole = (typeof orgRoleValues)[number];

export type OrgMember = {
  userId: string;
  orgId: string;
  role: OrgRole;
  createdAt: string;
  // Infos utilisateur (à joindre depuis auth.users ou profiles)
  email?: string;
  fullName?: string;
};
