import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../types/Database";
import type { TestRepo } from "@/core/ports/TestRepo";
import type {
  Test,
  TestQuestion,
  TestQuestionKind,
  TestType,
  CreateTestInput,
  CreateQuestionInput,
  UpdateTestInput,
  CreateTestReviewInput,
  StartTestSubmissionInput,
  SubmitTestAnswersInput,
  TestAnswer,
  TestReview,
  TestSubmission,
  UpdateQuestionInput,
  DeleteTestInput,
  ArchiveTestInput,
} from "@/core/models/Test";

type Db = SupabaseClient<Database>;

function mapTestRow(row: Tables<"tests">): Test {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    type: row.type as TestType,
    description: row.description,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapQuestionRow(row: Tables<"test_questions">): TestQuestion {
  return {
    id: row.id,
    orgId: row.org_id,
    testId: row.test_id,
    label: row.label,
    kind: row.kind as TestQuestionKind,
    orderIndex: row.order_index,
    minValue: row.min_value ?? null,
    maxValue: row.max_value ?? null,
    options: (row.options as string[] | null) ?? null,
    isRequired: row.is_required,
    createdAt: row.created_at,
  };
}

export function makeTestRepo(sb: Db): TestRepo {
  return {
    async listTestsByOrg(orgId: string): Promise<Test[]> {
      const { data, error } = await sb
        .from("tests")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapTestRow);
    },

    async getTestById(id: string, orgId: string): Promise<Test | null> {
      const { data, error } = await sb
        .from("tests")
        .select("*")
        .eq("id", id)
        .eq("org_id", orgId)
        .maybeSingle();

      if (error) {
        if ("code" in error && error.code === "PGRST116") return null;
        throw error;
      }
      if (!data) return null;
      return mapTestRow(data);
    },

    async createTest(input: CreateTestInput): Promise<Test> {
      const insert: TablesInsert<"tests"> = {
        org_id: input.orgId,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        is_active: input.isActive,
        created_by: input.createdBy,
      };

      const { data, error } = await sb
        .from("tests")
        .insert(insert)
        .select("*")
        .single();

      if (error || !data) {
        console.error("[TestRepo.createTest] insert error", error);
        throw error ?? new Error("Failed to create test");
      }

      return mapTestRow(data);
    },

    async updateTest(input: UpdateTestInput): Promise<Test> {
      const { id, orgId, name, description, isActive } = input;

      const patch: Record<string, unknown> = {};
      if (name !== undefined) patch.name = name;
      if (description !== undefined) patch.description = description;
      if (isActive !== undefined) patch.is_active = isActive;

      const { data, error } = await sb
        .from("tests")
        .update(patch)
        .eq("id", id)
        .eq("org_id", orgId)
        .select("*")
        .single();

      if (error || !data) {
        console.error("[TestRepo.updateTest] error", error);
        throw error ?? new Error("Failed to update test");
      }

      return mapTestRow(data);
    },
    async deleteTest(input: DeleteTestInput): Promise<void> {
      const { testId, orgId } = input;
      console.log("[TestRepo.deleteTest] deleting", { testId, orgId });
    
      const { error } = await sb
        .from("tests")
        .delete()
        .eq("id", testId)
        .eq("org_id", orgId);
    
      if (error) {
        console.error("[TestRepo.deleteTest] error", error);
    
        // FK violation → test utilisé quelque part
        if ("code" in error && error.code === "23503") {
          throw new Error(
            "Ce test est utilisé dans un parcours ou un résultat de candidat. Il ne peut pas être supprimé."
          );
        }
    
        throw error;
      }
    },
  
    async archiveTest(input: ArchiveTestInput): Promise<void> {
      const { testId, orgId } = input;
      console.log("[TestRepo.archiveTest] archiving", { testId, orgId });

      const { error } = await sb
        .from("tests")
        .update({ is_active: false })
        .eq("id", testId)
        .eq("org_id", orgId);

      if (error) {
        console.error("[TestRepo.archiveTest] error", error);
        throw error;
      }
    },

    async getTestWithQuestions(testId: string, orgId: string) {
      const { data: test, error: testError } = await sb
        .from("tests")
        .select("*")
        .eq("id", testId)
        .eq("org_id", orgId)
        .maybeSingle();

      if (testError) throw testError;
      if (!test) return null;

      const { data: questions, error: qError } = await sb
        .from("test_questions")
        .select("*")
        .eq("test_id", testId)
        .eq("org_id", orgId)
        .order("order_index");

      if (qError) throw qError;

      return {
        test: mapTestRow(test),
        questions: (questions ?? []).map(mapQuestionRow),
      };
    },

    async addQuestion(input: CreateQuestionInput): Promise<TestQuestion> {
      const insert: TablesInsert<"test_questions"> = {
        org_id: input.orgId,
        test_id: input.testId,
        label: input.label,
        kind: input.kind,
        min_value: input.minValue ?? null,
        max_value: input.maxValue ?? null,
        options: (input.options ?? null) as TablesInsert<"test_questions">["options"],
        order_index: input.orderIndex ?? 1,
        is_required: input.isRequired ?? true,
      };

      const { data, error } = await sb
        .from("test_questions")
        .insert(insert)
        .select("*")
        .single();

      if (error || !data) {
        console.error("[TestRepo.addQuestion] insert error", error);
        throw error ?? new Error("Failed to add question");
      }

      return mapQuestionRow(data);
    },

    async updateQuestion(input: UpdateQuestionInput): Promise<TestQuestion> {
      const patch: TablesUpdate<"test_questions"> = {
        label: input.label,
        kind: input.kind,
        min_value: input.kind === "scale" ? input.minValue ?? null : null,
        max_value: input.kind === "scale" ? input.maxValue ?? null : null,
        options:
          input.kind === "choice"
            ? ((input.options ?? null) as TablesUpdate<"test_questions">["options"])
            : null,
        is_required: input.isRequired ?? true,
      };

      const { data, error } = await sb
        .from("test_questions")
        .update(patch)
        .eq("id", input.questionId)
        .eq("org_id", input.orgId)
        .select("*")
        .single();

      if (error || !data) {
        console.error("[TestRepo.updateQuestion] error", error);
        throw error ?? new Error("Failed to update question");
      }

      return mapQuestionRow(data);
    },

    async reorderQuestions({ orgId, testId, order }) {
      for (const it of order) {
        const { error } = await sb
          .from("test_questions")
          .update({ order_index: it.orderIndex })
          .eq("org_id", orgId)
          .eq("test_id", testId)
          .eq("id", it.questionId);
    
        if (error) throw error;
      }
    },
    async deleteQuestion(questionId: string, orgId: string): Promise<void> {
      const { error } = await sb
        .from("test_questions")
        .delete()
        .eq("id", questionId)
        .eq("org_id", orgId);

      if (error) {
        console.error("[TestRepo.deleteQuestion] error", error);
        throw error;
      }
    },

    async startSubmission(_input: StartTestSubmissionInput): Promise<TestSubmission> {
      throw new Error("Not implemented");
    },

    async submitAnswers(_input: SubmitTestAnswersInput): Promise<{
      submission: TestSubmission;
      answers: TestAnswer[];
    }> {
      throw new Error("Not implemented");
    },

    async listSubmissionsByCandidate(
      _candidateId: string,
      _orgId: string
    ): Promise<TestSubmission[]> {
      throw new Error("Not implemented");
    },

    async getSubmissionWithAnswers(_input: {
      submissionId: string;
      orgId: string;
    }): Promise<{
      submission: TestSubmission;
      answers: TestAnswer[];
      test: Test;
      questions: TestQuestion[];
    }> {
      throw new Error("Not implemented");
    },

    async addReview(_input: CreateTestReviewInput): Promise<TestReview> {
      throw new Error("Not implemented");
    },

    async listReviewsForSubmission(
      _submissionId: string,
      _orgId: string
    ): Promise<TestReview[]> {
      throw new Error("Not implemented");
    },
  };
}
