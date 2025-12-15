import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/Database";
import type { TestRepo } from "@/core/ports/TestRepo";
import type { Test, TestQuestion, TestQuestionKind, TestType } from "@/core/models/Test";

type Db = SupabaseClient<Database>;

export function makeTestRepo(supabase: Db): TestRepo {
  return {
    async getTestWithQuestions(testId: string, orgId: string): Promise<{ test: Test; questions: TestQuestion[] } | null> {
      const { data: test, error: testError } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .eq("org_id", orgId)
        .maybeSingle();

      if (testError) throw testError;
      if (!test) return null;

      const { data: questions, error: qError } = await supabase
        .from("test_questions")
        .select("*")
        .eq("test_id", testId)
        .eq("org_id", orgId)
        .order("order_index");

      if (qError) throw qError;

      return {
        test: {
          id: test.id,
          orgId: test.org_id,
          name: test.name,
          type: test.type as TestType,
          description: test.description,
          isActive: test.is_active,
          createdBy: test.created_by,
          createdAt: test.created_at,
        },
        questions: (questions ?? []).map((q): TestQuestion => ({
          id: q.id,
          orgId: q.org_id,
          testId: q.test_id,
          label: q.label,
          kind: q.kind as TestQuestionKind,
          orderIndex: q.order_index,
          minValue: q.min_value,
          maxValue: q.max_value,
          options: q.options as string[] | null,
          isRequired: q.is_required,
          createdAt: q.created_at,
        })),
      };
    },
    async listTestsByOrg() {
        throw new Error("Not implemented");
      },
      async getTestById() {
        throw new Error("Not implemented");
      },
      async createTest() {
        throw new Error("Not implemented");
      },
      async updateTest() {
        throw new Error("Not implemented");
      },

      async archiveTest() {
        throw new Error("Not implemented");
      },
      async addQuestion() {
        throw new Error("Not implemented");
      },
      async updateQuestion() {
        throw new Error("Not implemented");
      },
      async reorderQuestions() {
        throw new Error("Not implemented");
      },
      async deleteQuestion() {
        throw new Error("Not implemented");
      },
      async startSubmission() {
        throw new Error("Not implemented");
      },
      async submitAnswers() {
        throw new Error("Not implemented");
      },
      async listSubmissionsByCandidate() {
        throw new Error("Not implemented");
      },
      async getSubmissionWithAnswers() {
        throw new Error("Not implemented");
      },
      async addReview() {
        throw new Error("Not implemented");
      },
      async listReviewsForSubmission() {
        throw new Error("Not implemented");
      },
  };
  
}