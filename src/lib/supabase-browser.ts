import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";

// Singleton pour éviter les multiples instances
// Cela empêche plusieurs instances du client de tenter de rafraîchir le token simultanément
let client: SupabaseClient<Database> | undefined;

export const supabaseBrowser = () => {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Utilise les cookies par défaut (même stockage que le serveur)
      // @supabase/ssr gère automatiquement la lecture/écriture des cookies
      isSingleton: true,
    }
  );

  return client;
};