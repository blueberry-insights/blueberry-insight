export interface AuthService {
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, meta: { full_name: string; org_name: string }, emailRedirectTo?: string): Promise<{ user: { id: string } | null }>;
  signOut(): Promise<void>;
  currentUserId(): Promise<string | null>;
  exchangeCodeForSession(code: string): Promise<void>;
  sendResetEmail(email: string, redirectTo: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

