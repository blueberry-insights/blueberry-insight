// app/(app)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/shared/ui/layout";
import { UserMenu, ButtonLogout } from "@/shared/ui/navigation";
import { getSessionUser, getFirstMembership } from "@/infra/supabase/session";

type UserMetadata = {
  full_name?: string;
  org_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirectedFrom=%2Fdashboard");

  const membership = await getFirstMembership(user.id);

  if (!membership) {
    console.error("[AppLayout] user without membership:", user.id);

    redirect(
      "/login?error=" +
        encodeURIComponent("Compte mal initialisé. Réessaie l’inscription.")
    );
  }

  const orgName = membership.organizations?.name ?? "";
  const meta = (user.user_metadata ?? {}) as UserMetadata;

  const displayName =
    meta.full_name || user.email?.split("@")[0] || "Utilisateur";

  const headerRightSlot = (
    <UserMenu
      size="sm"
      displayName={displayName}
      orgName={orgName}
      avatarUrl={meta.avatar_url}
    />
  );

  const sidebarFooterSlot = <ButtonLogout />;

  return (
    <AppShell
      headerRightSlot={headerRightSlot}
      sidebarFooterSlot={sidebarFooterSlot}
      defaultCollapsed={false}
      autoCollapseOnNavigate={false}
    >
      {children}
    </AppShell>
  );
}
