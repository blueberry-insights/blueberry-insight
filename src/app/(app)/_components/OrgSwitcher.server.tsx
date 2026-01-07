// app/(app)/_components/OrgSwitcher.server.tsx
import { cookies } from "next/headers";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { makeMembershipRepo } from "@/infra/supabase/adapters/membership.repo.supabase";
import { makeOrgRepo } from "@/infra/supabase/adapters/org.repo.supabase";
import { OrgSwitcherClient } from "@/shared/ui/navigation/OrgSwitcher.client";

export default async function OrgSwitcherServer() {
  const sb = await supabaseServerRSC();

  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const membershipRepo = makeMembershipRepo(sb);
  const orgRepo = makeOrgRepo(sb);

  const memberships = await membershipRepo.listForUser(user.id);

  const orgsRaw = await Promise.all(
    memberships.map(async (m) => {
      const org = await orgRepo.getById(m.orgId);
      if (!org) return null;
      return { id: org.id, name: org.name, role: m.role };
    })
  );

  const orgs = orgsRaw.filter(Boolean) as Array<{ id: string; name: string; role: string }>;
  if (!orgs.length) return null;

  // ✅ cookies() est async chez toi
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org_id")?.value ?? orgs[0].id;

  return <OrgSwitcherClient orgs={orgs} activeOrgId={activeOrgId} />;
}
