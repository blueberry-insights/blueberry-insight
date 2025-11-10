import { AuthService } from "../ports/AuthService";
import { OrgRepo } from "../ports/OrgRepo";
import { MembershipRepo } from "../ports/MembershipRepo";
import { Slugger } from "../ports/Slugger";

function sanitizeOrgName(name: string) {
  const n = (name || "").trim();
  if (n.length < 3 || n.length > 80) return null;
  return n;
}

export function makeEnsureOrgOnFirstLogin(
  deps: { auth: AuthService; orgs: OrgRepo; memberships: MembershipRepo; slugger: Slugger }
) {
  return async function ensureOrgOnFirstLogin(inputOrgName?: string) {
    const userId = await deps.auth.currentUserId();
    if (!userId) throw new Error("not-authenticated");

    if (await deps.memberships.hasAnyForUser(userId)) return { created: false };

    const safeName = sanitizeOrgName(inputOrgName || "") || "My Organization";
    const base = deps.slugger.slugify(safeName);
    const slug = await deps.slugger.uniquify(base, async (s) => !!(await deps.orgs.findBySlug(s)));


    const org = await deps.orgs.create(safeName, slug, userId);
    await deps.memberships.add(userId, org.id, "owner");

    return { created: true, orgId: org.id, slug };
  };
}
