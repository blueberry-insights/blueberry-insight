import type { SessionReader } from "@/core/ports/SeesionReader";
import type { OrgRepo } from "@/core/ports/OrgRepo";
import type { MembershipRepo } from "@/core/ports/MembershipRepo";
import type { Slugger } from "@/core/ports/Slugger";

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

    if (await deps.memberships.hasAnyForUser(userId)) {
      return { created: false };
    }

    const safeName = sanitizeOrgName(inputOrgName || "") || "My Organization";
    const base = deps.slugger.slugify(safeName);
    let slug = `${base}-${userId.slice(0, 8)}`;

    try {
      const org = await deps.orgs.create(safeName, slug, userId);
      await deps.memberships.add(userId, org.id, "owner");
      return { created: true, orgId: org.id, slug };
    } catch (err) {
      // On typpe l'erreur de façon minimaliste
      const e = err as {
        message?: string;
        code?: string;
        cause?: { code?: string };
      };

      const msg = String(e.message || "");
      const code = e.code ?? e.cause?.code;
      const isDup =
        code === "23505" ||
        msg.includes("duplicate key") ||
        msg.includes("slug");

      if (!isDup) {
        // Si ce n'est pas une collision de slug, on propage l'erreur d'origine
        throw err;
      }

      // Collision → on regénère un slug avec suffixe random
      slug = `${base}-${userId.slice(0, 8)}-${Math.random()
        .toString(36)
        .slice(2, 5)}`;

      const org = await deps.orgs.create(safeName, slug, userId);
      await deps.memberships.add(userId, org.id, "owner");
      return { created: true, orgId: org.id, slug };
    }
  };
}
