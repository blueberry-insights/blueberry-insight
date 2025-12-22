// src/app/(app)/tests/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { TestLibraryScreen } from "@/features/tests/components/screens/TestLibraryScreen";

export default async function TestsPage() {
  const { sb, orgId } = await requireUserAndOrgForPage("/tests");

  const repo = makeTestRepo(sb);
  const tests = await repo.listTestsByOrg(orgId);

  return <TestLibraryScreen orgId={orgId} initialTests={tests} />;
}
