import type { AuthService } from "../ports/AuthService";
export const makeLoginUser = (auth: AuthService) =>
  async (email: string, password: string) => auth.signIn(email, password);
