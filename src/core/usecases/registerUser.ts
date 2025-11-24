import type { AuthService } from "../ports/AuthService";

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
  emailRedirectTo?: string;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: "email-in-use" | "unknown" };

function isEmailAlreadyUsed(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("already") || normalized.includes("exists");
}

export const makeRegisterUser = (auth: AuthService) => {
  return async (input: RegisterInput): Promise<RegisterResult> => {
    try {
      await auth.signUp(
        input.email,
        input.password,
        { full_name: input.fullName, org_name: input.orgName },
        input.emailRedirectTo
      );
      return { ok: true };
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "")
          : "";

      if (message && isEmailAlreadyUsed(message)) {
        return { ok: false, reason: "email-in-use" };
      }

      return { ok: false, reason: "unknown" };
    }
  };
};