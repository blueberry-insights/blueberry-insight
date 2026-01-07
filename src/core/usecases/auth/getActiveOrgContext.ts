// core/usecases/auth/getActiveOrgContext.ts
import type { SessionReader } from "@/core/ports/SeesionReader"; // (typo probable: SeesionReader)
import type { MembershipRepo } from "@/core/ports/MembershipRepo";
import type { OrgRepo } from "@/core/ports/OrgRepo";
import type { OrgRole } from "@/core/models/Membership";

type Result =
  | {
      ok: true;
      orgId: string;
      role: OrgRole;
      org: {
        id: string;
        name: string;
        slug: string;
        createdBy: string;
      };
    }
  | {
      ok: false;
      reason: "not-authenticated" | "no-org" | "org-not-found";
    };

export function makeGetActiveOrgContext(deps: {
  auth: SessionReader;
  memberships: MembershipRepo;
  orgs: OrgRepo;
}) {
  return async function getActiveOrgContext(
    preferredOrgId?: string | null
  ): Promise<Result> {
    const userId = await deps.auth.currentUserId();
    if (!userId) return { ok: false, reason: "not-authenticated" };

    const memberships = await deps.memberships.listForUser(userId);
    if (!memberships.length) return { ok: false, reason: "no-org" };

    // 1) Si un cookie existe et que l'user est membre -> c'est l'active org
    const fromCookie = preferredOrgId
      ? memberships.find((m) => m.orgId === preferredOrgId)
      : null;

    const active = fromCookie ?? memberships[0];

    const org = await deps.orgs.getById(active.orgId);
    if (!org) return { ok: false, reason: "org-not-found" };

    return {
      ok: true,
      orgId: org.id,
      role: active.role,
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdBy: org.createdBy,
      },
    };
  };
}
