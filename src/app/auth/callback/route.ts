import { NextResponse } from "next/server";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const flow = (url.searchParams.get("flow") || "").toLowerCase();
  const email = url.searchParams.get("email") || "";

  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  console.log("[auth/callback] params:", {
    hasCode: !!code,
    type,
    flow,
    email,
    error,
    errorCode,
    errorDescription,
    pathname: url.pathname,
    fullUrl: url.toString(),
  });

  if (error) {
    let errorMessage = "Erreur d'authentification";

    let redirectPath = "/login";

    if (errorCode === "otp_expired") {
      errorMessage =
        "Le lien a expiré. Demande un nouveau lien de confirmation.";
      redirectPath = "/auth/verify";
    } else if (errorCode === "email_not_confirmed") {
      errorMessage = "Email non confirmé. Vérifie ta boîte mail.";
      redirectPath = "/auth/verify";
    } else if (errorDescription) {
      errorMessage = decodeURIComponent(errorDescription);
      redirectPath = "/auth/verify";
    }

    console.error("[auth/callback] Supabase error:", {
      error,
      errorCode,
      errorDescription,
      flow,
      type,
      email,
    });

    const redirectUrl = new URL(redirectPath, url);

    if (email && redirectPath.startsWith("/auth/verify")) {
      redirectUrl.searchParams.set("email", email);
    }

    redirectUrl.searchParams.set("error", errorMessage);

    return NextResponse.redirect(redirectUrl);
  }

  const auth = await makeAuthServiceForAction();

  if (code) {
    try {
      await auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error("[auth/callback] exchangeCodeForSession failed:", e);

      const userId = await auth.currentUserId();
      if (!userId) {
        // Pas de session → erreur
        const redirectUrl = new URL("/login", url);
        redirectUrl.searchParams.set("error", "Lien invalide ou expiré");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  const userId = await auth.currentUserId();

  if (!userId) {
    console.error("[auth/callback] No session found");
    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set(
      "error",
      "Session introuvable. Le lien a peut-être expiré."
    );
    return NextResponse.redirect(redirectUrl);
  }

  console.log("[auth/callback] Session active, userId:", userId);

  if (type === "recovery" || flow === "reset") {
    return NextResponse.redirect(new URL("/auth/reset/confirm", url));
  }

  if (type === "signup" || flow === "signup") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  return NextResponse.redirect(new URL("/dashboard", url));
}
