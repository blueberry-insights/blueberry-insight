import type { AuthService } from "../ports/AuthService";

export type UpdatePasswordInput = {
  password: string;
};

export type UpdatePasswordResult =
  | { ok: true }
  | { ok: false; reason: "unknown" };

export const makeUpdatePassword = (auth: AuthService) => {
  return async (
    input: UpdatePasswordInput
  ): Promise<UpdatePasswordResult> => {
    try {
      await auth.updatePassword(input.password);
      return { ok: true };
    } catch {
      return { ok: false, reason: "unknown" };
    }
  };
};

