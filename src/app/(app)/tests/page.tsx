// src/app/(app)/tests/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { TestLibraryScreen } from "@/features/tests/components/screens/TestLibraryScreen";
import { redirect } from "next/navigation";
import { isBlueberryAdmin } from "@/shared/utils/roles";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TestsPage() {
  const { sb, orgId , role } = await requireUserAndOrgForPage("/tests");

  const repo = makeTestRepo(sb);
  const tests = await repo.listTestsByOrg(orgId);

  if (!isBlueberryAdmin({ orgId: orgId, role: role })) {
    redirect("/dashboard?error=forbidden");
  }
  return <TestLibraryScreen orgId={orgId} initialTests={tests} />;
}
