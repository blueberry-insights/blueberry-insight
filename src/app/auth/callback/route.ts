// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const flow = (url.searchParams.get("flow") || "").toLowerCase(); // 👈 notre flag

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Code manquant", url));
  }

  const auth = await makeAuthServiceForAction();
  try {
    await auth.exchangeCodeForSession(code); // pose la session (cookies)
  } catch (e) {
    console.error("exchangeCodeForSession failed:", e);
    return NextResponse.redirect(new URL("/login?error=Activation échouée", url));
  }

  // 🔐 Priorité absolue au flux reset
  if (flow === "reset" || type === "recovery") {
    return NextResponse.redirect(new URL("/auth/reset/confirm", url));
  }

  // ✅ Inscription (ou magic link général)
  if (type === "signup") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  // Fallback neutre
  return NextResponse.redirect(new URL("/dashboard", url));
}
