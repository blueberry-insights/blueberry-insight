
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthService } from "@/core/ports/AuthService";
import { supabaseAdmin } from "../client";

export function authServiceSupabase(sb: SupabaseClient): AuthService {
  return {
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password, meta, emailRedirectTo) {
      console.log("[authServiceSupabase] signUp called with emailRedirectTo:", emailRedirectTo);
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: meta, ...(emailRedirectTo ? { emailRedirectTo } : {}) },
      });
      if (error) {
        console.error("[authServiceSupabase] signUp error:", error);
        throw error;
      }
      console.log("[authServiceSupabase] signUp success, user created:", !!data.user);
      return { user: data.user };
    },
    async signOut() {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
    },
    async currentUserId() {
      const { data: { user }, error } = await sb.auth.getUser();
      if (error) throw error;
      return user?.id ?? null;
    },
    async exchangeCodeForSession(code) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) throw error;
    },
     async sendResetEmail(email, redirectTo) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error; 
    },
    async updatePassword(newPassword) {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    async deleteUser(userId) {
      // Utilise l'Admin API pour supprimer un utilisateur
      const admin = supabaseAdmin();
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  };
}
