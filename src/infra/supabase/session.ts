// src/infra/supabase/session.ts
import "server-only";
import { supabaseServerRSC } from "./client";

/** Lit l'utilisateur courant côté serveur (RSC). */
export async function getSessionUser() {
  const sb = await supabaseServerRSC();
  const { data: { user } } = await sb.auth.getUser();
  return user; // null si non authentifié
}

/** Lit la première membership (et le nom d'orga) pour l'UI du layout. */
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
