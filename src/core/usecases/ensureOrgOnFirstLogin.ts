import type { SessionReader } from "../ports/SeesionReader";
import type { OrgRepo } from "../ports/OrgRepo";
import type { MembershipRepo } from "../ports/MembershipRepo";
import type { Slugger } from "../ports/Slugger";

function sanitizeOrgName(name: string) {
  const n = (name || "").trim();
  if (n.length < 3 || n.length > 80) return null;
  return n;
}

export function makeEnsureOrgOnFirstLogin(
  deps: { auth: SessionReader; orgs: OrgRepo; memberships: MembershipRepo; slugger: Slugger }
) {
  return async function ensureOrgOnFirstLogin(inputOrgName?: string) {
    const userId = await deps.auth.currentUserId();
    if (!userId) throw new Error("not-authenticated");

    // Déjà membre ? on ne fait rien
    if (await deps.memberships.hasAnyForUser(userId)) return { created: false };

    const safeName = sanitizeOrgName(inputOrgName || "") || "My Organization";
    const base = deps.slugger.slugify(safeName);
    let slug = `${base}-${userId.slice(0, 8)}`;

    try {
      const org = await deps.orgs.create(safeName, slug, userId);     
      await deps.memberships.add(userId, org.id, "owner");
      return { created: true, orgId: org.id, slug };
    } catch (e: any) {
      const msg = String(e?.message || "");
      const code = e?.code ?? e?.cause?.code;
      const isDup = code === "23505" || msg.includes("duplicate key") || msg.includes("slug");
      if (!isDup) throw e;

      slug = `${base}-${userId.slice(0, 8)}-${Math.random().toString(36).slice(2, 5)}`;
      const org = await deps.orgs.create(safeName, slug, userId);
      await deps.memberships.add(userId, org.id, "owner");
      return { created: true, orgId: org.id, slug };
    }
  };
}
