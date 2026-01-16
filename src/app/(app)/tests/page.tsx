// src/app/(app)/tests/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { TestLibraryScreen } from "@/features/tests/components/screens/TestLibraryScreen";
import { redirect } from "next/navigation";
import { isBlueberryAdmin } from "@/shared/utils/roles";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type TargetOrg = { id: string; name: string; slug: string }; 

export default async function TestsPage() {
  const { sb, orgId , role } = await requireUserAndOrgForPage("/tests");

  const repo = makeTestRepo(sb);
  const tests = await repo.listTestsByOrg(orgId);

  const { data: targetOrgs, error } = await sb.rpc("list_targetable_organizations");
  if (error) throw error;

  if (!isBlueberryAdmin({ orgId: orgId, role: role })) {
    redirect("/dashboard?error=forbidden");
  }
  return <TestLibraryScreen orgId={orgId} initialTests={tests} targetOrgs={(targetOrgs ?? []) as TargetOrg[]}/>;
}
