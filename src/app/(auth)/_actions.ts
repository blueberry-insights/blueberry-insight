"use server";
import { redirect } from "next/navigation";
import { LoginSchema, RegisterSchema, ResetPasswordSchema, UpdatePasswordSchema } from "@/shared/validation/auth";
import { sanitizeRedirect } from "@/shared/utils/sanitizeRedirect";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";

export async function loginAction(formData: FormData) {
  const auth = await makeAuthServiceForAction();
  const safeRedirect = sanitizeRedirect(formData.get("redirectTo"));

  const payload = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };
  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Identifiants invalides.";
    return redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  try {
    await auth.signIn(parsed.data.email, parsed.data.password);
  } catch (e: any) {
    const m = String(e?.message || "").toLowerCase();
    if (m.includes("confirm")) {
      return redirect(`/auth/verify?email=${encodeURIComponent(parsed.data.email)}`);
    }
    return redirect(`/login?error=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
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
    fullName: String(formData.get("fullName") || ""),
    orgName: String(formData.get("orgName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  };

  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Formulaire invalide";
    return redirect(`/register?error=${encodeURIComponent(msg)}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const emailRedirectTo =
    appUrl && appUrl.startsWith("http") ? `${appUrl}/auth/callback` : undefined;

  try {
    await auth.signUp(
      parsed.data.email,
      parsed.data.password,
      { full_name: parsed.data.fullName, org_name: parsed.data.orgName },
      emailRedirectTo
    );
  } catch {
    const generic =
      process.env.NODE_ENV === "production"
        ? "Inscription en cours. Vérifie ton email."
        : "Un compte existe peut-être déjà avec cet email.";
    return redirect(`/register?error=${encodeURIComponent(generic)}`);
  }

  return redirect(`/auth/verify?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function resetPasswordAction(_prev: any, formData: FormData) {
  const parsed = ResetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email invalide" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.trim();
  // 👇 on tag explicitement le flux
  const redirectTo = `${appUrl}/auth/callback?flow=reset`;

  const auth = await makeAuthServiceForAction();
  try { await auth.sendResetEmail(parsed.data.email, redirectTo); } catch {}
  return { ok: true };
}

export async function updatePasswordAction(_prev: any, formData: FormData) {
  const payload = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = UpdatePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Vérifiez les champs";
    return { ok: false, error: msg };
  }

  const auth = await makeAuthServiceForAction();
  try {
    await auth.updatePassword(parsed.data.password);
  } catch (e: any) {
    console.error("updatePasswordAction error:", e); // 👈 utile
    const msg = e?.message || e?.error_description || "Impossible de mettre à jour le mot de passe";
    return { ok: false, error: msg };
  }
  return redirect("/login?reset=success");
}