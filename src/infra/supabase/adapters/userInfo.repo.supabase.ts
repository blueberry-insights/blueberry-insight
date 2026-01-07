/**
 * Adapter Supabase pour UserInfoRepo.
 * Implémente la récupération des infos utilisateur via l'API admin de Supabase.
 */
import { supabaseAdmin } from "../client";
import type { UserInfoRepo, UserInfo } from "@/core/ports/UserInfoRepo";

export function makeUserInfoRepo(): UserInfoRepo {
  return {
    async getUserById(userId: string): Promise<UserInfo | null> {
      try {
        const adminClient = supabaseAdmin();
        const { data: userData } = await adminClient.auth.admin.getUserById(userId);
        
        if (!userData?.user) {
          return null;
        }

        return {
          userId: userData.user.id,
          email: userData.user.email ?? null,
          fullName: (userData.user.user_metadata?.full_name as string | undefined) ?? null,
        };
      } catch (err) {
        console.warn(`[UserInfoRepo.getUserById] Unable to fetch user ${userId}:`, err);
        return null;
      }
    },

    async getUsersByIds(userIds: string[]): Promise<Map<string, UserInfo>> {
      const userInfoMap = new Map<string, UserInfo>();
      
      // Retirer les doublons et valeurs nulles
      const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
      
      if (uniqueUserIds.length === 0) {
        return userInfoMap;
      }

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const info = await this.getUserById(userId);
          if (info) {
            userInfoMap.set(userId, info);
          }
        })
      );

      return userInfoMap;
    },
  };
}

