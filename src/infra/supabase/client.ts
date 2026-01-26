import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/Database";
import { env } from "@/config/env";

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client Admin avec service role key (pour opérations admin comme deleteUser)
export function supabaseAdmin() {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function supabaseServerRSC() {
  const jar = await cookies(); 
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: () => {},
    },
  });
}


export async function supabaseServerAction() {
  const jar = await cookies(); 
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          jar.set(name, value, options);
        }
      },
    },
  });
}

/**
 * Client anonyme pour les routes API publiques.
 * Utilise l'anon key et s'appuie sur RLS + validation manuelle du token.
 * ⚠️ À utiliser uniquement pour les routes publiques avec validation de token dans le code.
 * 
 * NOTE: Pour les test_invites, RLS peut bloquer l'accès. Dans ce cas, utiliser
 * `supabaseAdminForPublicRoute()` avec validation stricte du token.
 */
export function supabaseAnon() {
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Client admin pour les routes API publiques avec token.
 * ⚠️ À utiliser UNIQUEMENT pour les routes publiques qui nécessitent un token valide.
 * 
 * La sécurité est assurée par :
 * 1. Validation stricte du token dans le code (vérification existence + expiration)
 * 2. Vérification que l'invite appartient à la bonne organisation
 * 3. Pas d'accès arbitraire aux données (seulement lecture des données liées au token)
 * 
 * Exemple d'utilisation :
 * ```typescript
 * const invite = await inviteRepo.getByToken(token);
 * if (!invite || new Date(invite.expiresAt) < new Date()) {
 *   return NextResponse.json({ error: "Invalid token" }, { status: 404 });
 * }
 * ```
 */
export function supabaseAdminForPublicRoute() {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

