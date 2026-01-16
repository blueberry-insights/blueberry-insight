
import "server-only";
import { redirect } from "next/navigation";
import { supabaseServerRSC, supabaseServerAction } from "./client";
import { cookies } from "next/headers";

export async function getSessionUser() {
  const sb = await supabaseServerRSC();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getFirstMembership(userId: string) {
  const sb = await supabaseServerRSC();
  const { data, error } = await sb
    .from("user_organizations")
    .select("*, organizations(name, id, slug)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}


export async function requireUserAndOrgForPage(redirectToOnFail: string) {
  const sb = await supabaseServerRSC();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(redirectToOnFail)}`);
  }

  // ✅ On récupère toutes les orgs (pas limit(1))
  const { data: memberships, error } = await sb
    .from("user_organizations")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    redirect("/dashboard?error=no-org");
  }

  // ✅ cookie active_org_id (Next récent → await cookies())
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("active_org_id")?.value ?? null;

  // ✅ Si cookie correspond à une org du user → on l’utilise
  const fromCookie = cookieOrgId
    ? memberships.find((m) => m.org_id === cookieOrgId)
    : undefined;

  // ✅ fallback MVP : première org
  const active = fromCookie ?? memberships[0];

  return {
    sb,
    user,
    userId: user.id,
    orgId: active.org_id as string,
    role: active.role as string,
    memberships, // pratique pour UI/debug si besoin
  };
}

/**
 * Pour les Server Actions / route handlers
 * → on NE fait pas de redirect ici, on jette des erreurs typées.
 */
export async function requireUserAndOrgForAction() {
  const sb = await supabaseServerAction();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    const err = new Error("not-authenticated") as Error & { code?: string };
    err.code = "not-authenticated";
    throw err;
  }

  const { data: memberships, error } = await sb
    .from("user_organizations")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    const err = new Error("org-not-found") as Error & { code?: string };
    err.code = "org-not-found";
    throw err;
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("active_org_id")?.value ?? null;

  const fromCookie = cookieOrgId
    ? memberships.find((m) => m.org_id === cookieOrgId)
    : undefined;

  const active = fromCookie ?? memberships[0];

  return {
    sb,
    user,
    userId: user.id,
    orgId: active.org_id as string,
    role: active.role as string,
    memberships,
  };
}


/**
 * Helper pour wrapper les Server Actions avec l'auth automatique.
 * Gère les erreurs d'auth de manière standardisée et passe le contexte à la fonction métier.
 */
export async function withAuth<T>(
  handler: (ctx: Awaited<ReturnType<typeof requireUserAndOrgForAction>>) => Promise<T>
): Promise<T | { ok: false; error: string }> {
  try {
    const ctx = await requireUserAndOrgForAction();
    console.log("[withAuth]", {
      userId: ctx.userId,
      orgId: ctx.orgId,
      role: ctx.role,
    });
    
    return await handler(ctx);
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    if (error?.code === "not-authenticated") {
      return { ok: false, error: "Non authentifié" };
    }
    if (error?.code === "org-not-found") {
      return { ok: false, error: "Organisation introuvable" };
    }
    console.error("[withAuth] session error:", err);
    return { ok: false, error: "Erreur de session" };
  }
}
