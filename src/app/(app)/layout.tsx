import { ReactNode } from "react";
import { supabaseServer } from "@/infra/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/shared/ui/AppShell";
import { UserMenu } from "@/shared/ui/UserMenu";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=%2F");
  }


  const { data: memberships } = await sb
    .from("user_organizations")
    .select("role, organizations(name, slug)")
    .eq("user_id", user.id)
    .limit(1);

  const orgName = memberships?.[0]?.organizations?.name ?? "";
  const displayName =
    (user.user_metadata as any)?.full_name ||
    user.email?.split("@")[0] ||
    "Utilisateur";

  const userSlot = <UserMenu displayName={displayName} orgName={orgName} avatarUrl={user?.user_metadata?.avatar_url}/>;

  return <AppShell userSlot={userSlot}>{children}</AppShell>;
}
