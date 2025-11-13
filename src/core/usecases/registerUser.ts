import type { AuthService } from "../ports/AuthService";

export const makeRegisterUser = (auth: AuthService) =>
  async (email: string, password: string, meta: { full_name: string; org_name: string }) => {
    return auth.signUp(email, password, meta);
  };