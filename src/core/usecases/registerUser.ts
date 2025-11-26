import type { AuthService } from "../ports/AuthService";
import type { OrgRepo } from "../ports/OrgRepo";
import type { MembershipRepo } from "../ports/MembershipRepo";
import type { Slugger } from "../ports/Slugger";

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
  emailRedirectTo?: string;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: "email-in-use" | "unknown" };

function isEmailAlreadyUsed(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("already") || normalized.includes("exists");
}

export const makeRegisterUser = (
  deps: {
    auth: AuthService;
    orgRepo: OrgRepo;
    membershipRepo: MembershipRepo;
    slugger: Slugger;
  }
) => {
  return async (input: RegisterInput): Promise<RegisterResult> => {
    let userId: string | null = null;

    try {
      const { user } = await deps.auth.signUp(
        input.email,
        input.password,
        { full_name: input.fullName, org_name: input.orgName },
        input.emailRedirectTo
      );

      if (!user) {
        return { ok: false, reason: "unknown" };
      }

      userId = user.id;

      // 2️⃣ Générer un slug unique pour l'organisation
      const baseSlug = deps.slugger.slugify(input.orgName);
      const slug = await deps.slugger.uniquify(
        `${baseSlug}-${userId.slice(0, 8)}`,
        async (s) => {
          const existing = await deps.orgRepo.findBySlug(s);
          return existing !== null;
        }
      );

      const org = await deps.orgRepo.create(input.orgName, slug, user.id);

 
      await deps.membershipRepo.add(user.id, org.id, "owner");

  
      return { ok: true };
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      const message = error?.message ?? "";

    
      if (message && isEmailAlreadyUsed(message)) {
        return { ok: false, reason: "email-in-use" };
      }


      if (userId) {
        try {
          console.log(`[registerUser] Rollback: deleting user ${userId} due to error:`, message);
          await deps.auth.deleteUser(userId);
        } catch (rollbackError) {
          console.error("[registerUser] Rollback failed - user may be orphaned:", rollbackError);
        }
      }

      return { ok: false, reason: "unknown" };
    }
  };
};
