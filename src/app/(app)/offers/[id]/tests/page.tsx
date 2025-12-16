import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeGetOfferTestFlowWithQuestions } from "@/core/usecases/tests/getOfferTestFlowWithQuestions";
import { TestFlowEditor } from "@/features/tests/components/TestFlowEditor";


export default async function OfferTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: offerId } = await params;

  const ctx = await requireUserAndOrgForPage(`/offers/${offerId}/tests`);

  const flowRepo = makeTestFlowRepo(ctx.sb);
  const testRepo = makeTestRepo(ctx.sb);
  const getFlow = makeGetOfferTestFlowWithQuestions(flowRepo, testRepo);
  const tests = await testRepo.listTestsByOrg(ctx.orgId);
  const data = await getFlow({ orgId: ctx.orgId, offerId });

  if (!data) {
    return (
      <div className="p-6 text-muted-foreground">
        Aucun flow de tests configuré pour cette offre.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Parcours de tests</h2>
      <TestFlowEditor offerId={offerId} flow={data.flow} items={data.items} tests={tests} />
    </div>
  );
}
