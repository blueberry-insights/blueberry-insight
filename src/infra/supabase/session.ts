
import "server-only";
import { redirect } from "next/navigation";
import { supabaseServerRSC, supabaseServerAction } from "./client";

export async function getSessionUser() {
  const sb = await supabaseServerRSC();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getFirstMembership(userId: string) {
  const sb = await supabaseServerRSC();
  const { data, error } = await sb
    .from("user_organizations")
    .select("*, organizations(name)")
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

  const { data, error } = await sb
    .from("user_organizations")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data?.org_id) {
    // à adapter plus tard (écran "pas d'org" si besoin)
    redirect("/dashboard?error=no-org");
  }

  return {
    sb,
    user,
    userId: user.id,
    orgId: data.org_id as string,
    role: data.role as string,
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

  const { data, error } = await sb
    .from("user_organizations")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data?.org_id) {
    const err = new Error("org-not-found") as Error & { code?: string };
    err.code = "org-not-found";
    throw err;
  }

  return {
    sb,
    user,
    userId: user.id,
    orgId: data.org_id as string,
    role: data.role as string,
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
