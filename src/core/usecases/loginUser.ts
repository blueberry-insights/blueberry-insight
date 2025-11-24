import type { AuthService } from "../ports/AuthService";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "email-not-confirmed" | "invalid-credentials" };

export const makeLoginUser = (auth: AuthService) => {
  return async ({ email, password }: LoginInput): Promise<LoginResult> => {
    try {
      await auth.signIn(email, password);
      return { ok: true };
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "").toLowerCase()
          : "";

      if (message.includes("confirm")) {
        return { ok: false, reason: "email-not-confirmed" };
      }

      return { ok: false, reason: "invalid-credentials" };
    }
  };
};
