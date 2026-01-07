/**
 * Port pour récupérer les informations utilisateur.
 * Permet de récupérer les infos d'utilisateurs (email, nom, etc.)
 * sans dépendre directement de l'implémentation Supabase.
 */
export type UserInfo = {
  userId: string;
  email: string | null;
  fullName: string | null;
};

export interface UserInfoRepo {
  /**
   * Récupère les informations d'un utilisateur par son ID.
   * Retourne null si l'utilisateur n'existe pas ou en cas d'erreur.
   */
  getUserById(userId: string): Promise<UserInfo | null>;

  /**
   * Récupère les informations de plusieurs utilisateurs en parallèle.
   * Retourne une Map userId -> UserInfo.
   */
  getUsersByIds(userIds: string[]): Promise<Map<string, UserInfo>>;
}

