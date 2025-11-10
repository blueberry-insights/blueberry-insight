import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {

  const store = await (cookies() as any);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof store.set === "function") {
                store.set({ name, value, ...options });
              }
            });
          } catch {
            // RSC: silencieux, Supabase gère quand même la session via lecture
          }
        },
      },
    }
  );
}
