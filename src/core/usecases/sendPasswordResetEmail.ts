import type { AuthService } from "../ports/AuthService";

export type SendPasswordResetInput = {
  email: string;
  redirectTo: string;
};

export type SendPasswordResetResult =
  | { ok: true }
  | { ok: false; reason: "unknown"; error?: unknown };

export const makeSendPasswordResetEmail = (auth: AuthService) => {
  return async (
    input: SendPasswordResetInput
  ): Promise<SendPasswordResetResult> => {
    try {
      await auth.sendResetEmail(input.email, input.redirectTo);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: "unknown", error: err };
    }
  };
};

