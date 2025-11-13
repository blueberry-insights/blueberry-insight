import { ResetPasswordSchema } from "@/shared/validation/auth";
import { makeAuthServiceForAction } from "@/infra/supabase/composition";

// app/(auth)/_actions.ts
export async function resetPasswordAction(_prev: any, formData: FormData) {
  const parsed = ResetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email invalide" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.trim();
  // ⬇️ AVANT:  `${appUrl}/auth/reset/confirm`
  // ⬇️ APRES: on passe par le callback serveur
  const redirectTo = `${appUrl}/auth/callback?next=/auth/reset/confirm`;

  const auth = await makeAuthServiceForAction();
  try { await auth.sendResetEmail(parsed.data.email, redirectTo); } catch {}
  return { ok: true };
}
