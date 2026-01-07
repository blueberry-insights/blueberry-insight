"use server";

import { supabaseServerAction } from "@/infra/supabase/client";
import { env } from "@/config/env";

export async function resendSignupEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;

  const sb = await supabaseServerAction();

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();
  const emailRedirectTo =
    appUrl && appUrl.startsWith("http")
      ? `${appUrl}/auth/callback?flow=signup&email=${encodeURIComponent(email)}`
      : undefined;

  try {
    await sb.auth.resend({
      type: "signup",
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
  } catch (err: unknown) {
    console.error("Resend signup email error:", err);
  }
}

