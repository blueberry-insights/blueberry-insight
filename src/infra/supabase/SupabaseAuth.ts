import { supabaseBrowser } from "@/lib/supabase-browser";
import type { AuthService } from "@/core/ports/AuthService";

export const SupabaseAuth: AuthService = {
  async signIn(email, password) {
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signUp(email, password, meta = {}) {
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signUp({ email, password, options: { data: meta } });
    if (error?.message?.toLowerCase().includes("already") || error?.status === 400) {
      throw new Error("Un compte existe déjà avec cet email. Essaie de te connecter.");
    }
     throw error;
  },
  async signOut() {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
  },
  async currentUserId() {
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    return user?.id ?? null;
  },
};
