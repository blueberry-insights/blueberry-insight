import type { AuthService } from "../ports/AuthService";
export const makeRegisterUser = (auth: AuthService) =>
  async (email: string, password: string, meta?: Record<string, unknown>) =>
    auth.signUp(email, password, meta);
