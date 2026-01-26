"use server";
import { redirect } from "next/navigation";
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
} from "@/shared/validation/auth";
import { sanitizeRedirect } from "@/shared/utils/sanitizeRedirect";
import { env } from "@/config/env";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";
import { supabaseAdmin } from "@/infra/supabase/client";
import { makeLoginUser } from "@/core/usecases/auth/loginUser";
import { makeRegisterUser } from "@/core/usecases/auth/registerUser";
import { makeSendPasswordResetEmail } from "@/core/usecases/auth/sendPasswordResetEmail";
import { makeUpdatePassword } from "@/core/usecases/auth/updatePassword";
import { logger } from "@/shared/utils/logger";

import { makeOrgRepo } from "@/infra/supabase/adapters/org.repo.supabase";
import { makeMembershipRepo } from "@/infra/supabase/adapters/membership.repo.supabase";
import { DefaultSlugger } from "@/infra/supabase/utils/slugger";
import { getString} from "@/shared/utils/formData";


type ResetState = { ok: boolean; error?: string };
type UpdateState = { ok: boolean; error?: string };

export async function loginAction(formData: FormData) {
  const auth = await makeAuthServiceForAction();
  const safeRedirect = sanitizeRedirect(formData.get("redirectTo"));

  const payload = {
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  };
  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Identifiants invalides.";
    return redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const loginUser = makeLoginUser(auth);
  const result = await loginUser(parsed.data);

  if (!result.ok) {
    if (result.reason === "email-not-confirmed") {
      return redirect(
        `/auth/verify?email=${encodeURIComponent(parsed.data.email)}`
      );
    }

    return redirect(
      `/login?error=${encodeURIComponent("Email ou mot de passe incorrect.")}`
    );
  }

  return redirect(safeRedirect);
}

export async function logoutAction() {
  const auth = await makeAuthServiceForAction();
  await auth.signOut();
  redirect("/login");
}

export async function registerAction(formData: FormData) {
  const auth = await makeAuthServiceForAction();

  const payload = {
    fullName: getString(formData, "fullName"),
    orgName: getString(formData, "orgName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  };

  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Formulaire invalide";
    return redirect(`/register?error=${encodeURIComponent(msg)}`);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  // Important : on marque bien le flow signup + on passe l'email au callback
  const emailRedirectTo =
    appUrl && appUrl.startsWith("http")
      ? `${appUrl}/auth/callback?flow=signup&email=${encodeURIComponent(
          parsed.data.email
        )}`
      : undefined;

  // ⚠️ ICI : on utilise le client ADMIN (service role)
  // → pas de RLS qui bloque la création d'organisation/membership
  const adminSb = supabaseAdmin();

  const registerUser = makeRegisterUser({
    auth,
    orgRepo: makeOrgRepo(adminSb),
    membershipRepo: makeMembershipRepo(adminSb),
    slugger: DefaultSlugger,
  });

  const result = await registerUser({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    orgName: parsed.data.orgName,
    emailRedirectTo,
  });

  if (!result.ok) {
    let errorMessage: string;

    if (result.reason === "email-in-use") {
      errorMessage =
        "Un compte existe déjà avec cet email. Essaie de te connecter ou de réinitialiser ton mot de passe.";
    } else {
      errorMessage = "Impossible de créer le compte pour le moment.";
    }

    return redirect(`/register?error=${encodeURIComponent(errorMessage)}`);
  }

  // Signup OK → on envoie l'utilisateur vers la page de vérification
  return redirect(`/auth/verify?email=${encodeURIComponent(parsed.data.email)}`);
}


export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = ResetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email invalide" };

  const rawAppUrl = env.NEXT_PUBLIC_APP_URL;
  if (!rawAppUrl) {
    logger.error("[resetPasswordAction] NEXT_PUBLIC_APP_URL is not set");
    return { ok: false, error: "Configuration invalide" };
  }

  const redirectTo = `${rawAppUrl.trim()}/auth/callback?flow=reset`;

  const auth = await makeAuthServiceForAction();
  const sendResetEmail = makeSendPasswordResetEmail(auth);
  const result = await sendResetEmail({
    email: parsed.data.email,
    redirectTo,
  });

  if (!result.ok && result.error) {
      logger.error("[resetPasswordAction] sendResetEmail error", undefined, result.error);
  }

  return { ok: true };
}



export async function updatePasswordAction(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState | never> {
  const parsed = UpdatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, error: "Vérifiez les champs" };

  const auth = await makeAuthServiceForAction();
  const updatePassword = makeUpdatePassword(auth);
  const result = await updatePassword({ password: parsed.data.password });

  if (!result.ok) {
    return { ok: false, error: "Impossible de mettre à jour le mot de passe" };
  }

  return redirect("/login?reset=success");
}
