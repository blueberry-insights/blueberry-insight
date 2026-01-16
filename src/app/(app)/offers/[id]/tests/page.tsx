// app/(app)/offers/[id]/tests/page.tsx
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeGetOfferTestFlowWithQuestions } from "@/core/usecases/tests/flows/getOfferTestFlowWithQuestions";
import { TestOfferScreen } from "@/features/tests/components/screens/TestOfferScreen";

export default async function OfferTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: offerId } = await params;
  const ctx = await  requireUserAndOrgForPage(`/offers/${offerId}/tests`);

  const flowRepo = makeTestFlowRepo(ctx.sb);
  const testRepo = makeTestRepo(ctx.sb);

  const getFlow = makeGetOfferTestFlowWithQuestions(flowRepo, testRepo);
  const data = await getFlow({ orgId: ctx.orgId, offerId });
  const tests = await testRepo.listBlueberryCatalogTests(ctx.orgId);

  return (
    <TestOfferScreen
      offerId={offerId}
      flowData={data?.flow ?? null }    
      items={data?.items ?? []}
      tests={tests}
    />
  );
}
