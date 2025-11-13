"use server";

import { supabaseServerAction } from "@/infra/supabase/client";

export async function resendSignupEmail(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return;

  const sb = await supabaseServerAction();

  try {
    await sb.auth.resend({
      type: "signup",
      email,
    });
  }  catch (err: unknown) {
    console.error("Resend signup email error:", err);
  }
}
