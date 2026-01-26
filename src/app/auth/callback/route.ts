import { NextResponse } from "next/server";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";
import { logger } from "@/shared/utils/logger";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const flow = (url.searchParams.get("flow") || "").toLowerCase();
  const email = url.searchParams.get("email") || "";

  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  // ✅ Log sécurisé : email est automatiquement masqué
  logger.debug("[auth/callback] params", {
    hasCode: !!code,
    type,
    flow,
    email, // ← Sera automatiquement masqué par sanitizeValue
    error,
    errorCode,
    errorDescription,
    pathname: url.pathname,
    // fullUrl peut contenir des tokens → on ne le log pas
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

    // ✅ Log sécurisé : email sera automatiquement masqué
    logger.error("[auth/callback] Supabase error", {
      error,
      errorCode,
      errorDescription,
      flow,
      type,
      email, // ← Sera automatiquement masqué par sanitizeValue
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
      logger.error("[auth/callback] exchangeCodeForSession failed", undefined, e);

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
    logger.error("[auth/callback] No session found");
    const redirectUrl = new URL("/login", url);
    redirectUrl.searchParams.set(
      "error",
      "Session introuvable. Le lien a peut-être expiré."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Log sécurisé : userId sera automatiquement masqué (UUID)
  logger.debug("[auth/callback] Session active", { userId });

  if (type === "recovery" || flow === "reset") {
    return NextResponse.redirect(new URL("/auth/reset/confirm", url));
  }

  if (type === "signup" || flow === "signup") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  return NextResponse.redirect(new URL("/dashboard", url));
}
