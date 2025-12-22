import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { TestEditorScreen } from "@/features/tests/components/screens/TestEditorScreen";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function TestEditorPage({ params }: Params) {
  const { id: testId } = await params;

  const ctx = await requireUserAndOrgForPage(`/tests/${testId}`);
  const repo = makeTestRepo(ctx.sb);
  const payload = await repo.getTestWithQuestions(testId, ctx.orgId);

  if (!payload) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Questionnaire introuvable ou vous n’y avez pas accès.
      </div>
    );
  }

  return (
    <TestEditorScreen
      test={payload.test}
      questions={payload.questions}
    />
  );
}
