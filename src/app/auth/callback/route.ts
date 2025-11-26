// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";

/**
 * Route de callback pour l'authentification Supabase.
 * 
 * Flow standard :
 * 1. Email contient un lien vers supabase.co/auth/v1/verify?token=...
 * 2. Supabase vérifie le token et crée une session
 * 3. Supabase redirige vers /auth/callback (cette route)
 * 4. On vérifie qu'on a une session active et on redirige selon le type
 * 
 * Cas particuliers :
 * - Si code présent : on l'échange contre une session (magic link direct)
 * - Si pas de code mais session active : Supabase a déjà créé la session
 * - Si pas de code et pas de session : erreur (token expiré ou déjà utilisé)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const flow = (url.searchParams.get("flow") || "").toLowerCase();
  
  // Gérer les erreurs renvoyées par Supabase
  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  console.log("[auth/callback] params:", { 
    hasCode: !!code, 
    type, 
    flow,
    error,
    errorCode,
    errorDescription,
    pathname: url.pathname,
    fullUrl: url.toString()
  });

  // Si Supabase a renvoyé une erreur, rediriger avec le message approprié
  if (error) {
    let errorMessage = "Erreur d'authentification";
    let redirectPath = "/login";
    
    if (errorCode === "otp_expired") {
      errorMessage = "Le lien a expiré. Demande un nouveau lien de confirmation.";
      // Pour signup, rediriger vers la page de vérification pour pouvoir renvoyer l'email
      if (flow === "signup" || type === "signup") {
        redirectPath = "/auth/verify";
      }
    } else if (errorCode === "email_not_confirmed") {
      errorMessage = "Email non confirmé. Vérifie ta boîte mail.";
      if (flow === "signup" || type === "signup") {
        redirectPath = "/auth/verify";
      }
    } else if (errorDescription) {
      errorMessage = decodeURIComponent(errorDescription);
      if (flow === "signup" || type === "signup") {
        redirectPath = "/auth/verify";
      }
    }
    
    console.error("[auth/callback] Supabase error:", { error, errorCode, errorDescription, flow, type });
    
    return NextResponse.redirect(
      new URL(`${redirectPath}?error=${encodeURIComponent(errorMessage)}`, url)
    );
  }

  const auth = await makeAuthServiceForAction();

  // Cas 1: On a un code (magic link direct ou flow PKCE)
  if (code) {
    try {
      await auth.exchangeCodeForSession(code);
      console.log("[auth/callback] Code exchanged successfully");
    } catch (e) {
      console.error("[auth/callback] exchangeCodeForSession failed:", e);
      
      // Vérifier si on a quand même une session (code déjà utilisé)
      const userId = await auth.currentUserId();
      if (!userId) {
        // Pas de session → erreur
        return NextResponse.redirect(
          new URL("/login?error=" + encodeURIComponent("Lien invalide ou expiré"), url)
        );
      }
      // On a une session, on continue
    }
  }

  // Cas 2: Vérifier qu'on a une session active (Supabase l'a créée après vérification du token)
  const userId = await auth.currentUserId();
  
  if (!userId) {
    console.error("[auth/callback] No session found");
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Session introuvable. Le lien a peut-être expiré."), url)
    );
  }

  console.log("[auth/callback] Session active, userId:", userId);

  // Redirection selon le type d'opération
  // Priorité au flux reset
  if (type === "recovery" || flow === "reset") {
    return NextResponse.redirect(new URL("/auth/reset/confirm", url));
  }

  // Flux signup (inscription)
  if (type === "signup" || flow === "signup") {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  // Fallback : rediriger vers le dashboard
  // (si aucun type/flow n'est préservé, on assume que c'est OK et on redirige vers le dashboard)
  return NextResponse.redirect(new URL("/dashboard", url));
}
