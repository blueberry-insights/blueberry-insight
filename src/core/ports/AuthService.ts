export interface AuthService {
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, meta?: Record<string, unknown>): Promise<void>;
  signOut(): Promise<void>;
  currentUserId(): Promise<string | null>;
}