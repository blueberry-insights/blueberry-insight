// app/(app)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AppShell } from "@/shared/ui/layout";
import { UserMenu, ButtonLogout, TestsToReviewDropdown } from "@/shared/ui/navigation";
import { Toaster } from "@/components/ui/toaster";

import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeMembershipRepo } from "@/infra/supabase/adapters/membership.repo.supabase";
import { makeOrgRepo } from "@/infra/supabase/adapters/org.repo.supabase";

// ✅ usecase
import { makeGetActiveOrgContext } from "@/core/usecases/auth/getActiveOrgContext";
import { makeAuthServiceForRSC } from "@/infra/supabase/composition"; 

import OrgSwitcherServer from "./_components/OrgSwitcher.server";
import { getSessionUser, requireUserAndOrgForPage } from "@/infra/supabase/session";
import { isBlueberryAdmin } from "@/shared/utils/roles";

type UserMetadata = {
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  // 1) session
  const auth = await makeAuthServiceForRSC()
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // 2) cookie active org
  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get("active_org_id")?.value ?? null;

  // 3) build repos
  const sb = await supabaseServerRSC(); // ✅ hors cache
  const memberships = makeMembershipRepo(sb);
  const orgs = makeOrgRepo(sb);

  // 4) active org context (cookie -> fallback first org)
  const getActiveOrgContext = makeGetActiveOrgContext({ auth, memberships, orgs });
  const ctx = await getActiveOrgContext(preferredOrgId);

  if (!ctx.ok) {
    // compte sans org / org cassée => renvoie login avec msg
    redirect(
      "/login?error=" +
        encodeURIComponent("Organisation introuvable. Réessaie l’inscription.")
    );
  }

  const { orgId, role } = await requireUserAndOrgForPage("/dashboard");

  const testRepo = makeTestRepo(sb);
  const toReviewCount = await testRepo.countSubmissionsToReview({ orgId });

  const meta = (user.user_metadata ?? {}) as UserMetadata;
  const displayName = meta.full_name || user.email?.split("@")[0] || "Utilisateur";
  const avatarUrl = meta.avatar_url || user.user_metadata?.avatar_url;

  const showTestsMenu = isBlueberryAdmin({
    orgId: orgId,
    role: role,
  });
  
  const headerRightSlot = (
    <div className="flex items-center gap-2">
      <OrgSwitcherServer />
      <TestsToReviewDropdown count={toReviewCount} items={[]} />
      <UserMenu
        size="sm"
        displayName={displayName}
        orgName={ctx.org.name}
        avatarUrl={avatarUrl}
      />
    </div>
  );

  return (
    <AppShell
      showTestsMenu={showTestsMenu}
      headerRightSlot={headerRightSlot}
      sidebarFooterSlot={<ButtonLogout />}
      defaultCollapsed={false}
      autoCollapseOnNavigate={false}
    >
      {children}
      <Toaster />
    </AppShell>
  );
}
