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
function mapSubmissionRow(row: Tables<"test_submissions">): TestSubmission {
  return {
    id: row.id,
    orgId: row.org_id,
    testId: row.test_id,
    candidateId: row.candidate_id,
    offerId: row.offer_id ?? null,
    submittedBy: row.submitted_by ?? null,
    submittedAt: row.submitted_at,
    numericScore: row.numeric_score ?? null,
    maxScore: row.max_score ?? null,
  };
}

function mapAnswerRow(row: Tables<"test_answers">): TestAnswer {
  return {
    id: row.id,
    orgId: row.org_id,
    submissionId: row.submission_id,
    questionId: row.question_id,
    valueText: row.value_text ?? null,
    valueNumber:
      row.value_number === null || row.value_number === undefined
        ? null
        : Number(row.value_number),
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
    businessCode: row.business_code ?? null,
    dimensionCode: row.dimension_code ?? null,
    dimensionOrder: row.dimension_order ?? null,
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
        business_code: input.businessCode ?? null,
        dimension_code: input.dimensionCode ?? null,
        dimension_order: input.dimensionOrder ?? null,
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

    async startSubmission(input: StartTestSubmissionInput): Promise<TestSubmission> {
      const insert: TablesInsert<"test_submissions"> = {
        org_id: input.orgId,
        test_id: input.testId,
        candidate_id: input.candidateId,
        offer_id: input.offerId ?? null,
        submitted_by: input.submittedBy ?? null,
        // submitted_at: laissé au default now()
        numeric_score: null,
        max_score: null,
      };

      const { data, error } = await sb
        .from("test_submissions")
        .insert(insert)
        .select("*")
        .single();

      if (error || !data) {
        console.error("[TestRepo.startSubmission] insert error", error);
        throw error ?? new Error("Failed to start submission");
      }

      return mapSubmissionRow(data);
    },

    async createSubmissionItems({ orgId, submissionId, items }) {
      if (!items.length) return;

      const payload: TablesInsert<"test_submission_items">[] = items.map(
        (it) => ({
          org_id: orgId,
          submission_id: submissionId,
          question_id: it.questionId,
          display_index: it.displayIndex,
          // created_at → default now()
        })
      );

      const { error } = await sb
        .from("test_submission_items")
        .insert(payload);

      if (error) {
        console.error("[TestRepo.createSubmissionItems] insert error", error);
        throw error;
      }
    },

    async submitAnswers(input: SubmitTestAnswersInput): Promise<{
      submission: TestSubmission;
      answers: TestAnswer[];
    }> {
      const { orgId, submissionId, answers, numericScore, maxScore } = input;
    
      // 1) Insertion des réponses
      const rows: TablesInsert<"test_answers">[] = answers.map((a) => ({
        org_id: orgId,
        submission_id: submissionId,
        question_id: a.questionId,
        value_text: a.valueText ?? null,
        value_number: a.valueNumber ?? null,
      }));
    
      const { data: inserted, error: insertError } = await sb
        .from("test_answers")
        .insert(rows)
        .select("*");
    
      if (insertError || !inserted) {
        console.error("[TestRepo.submitAnswers] insert answers error", insertError);
        throw insertError ?? new Error("Failed to insert test answers");
      }
    
      // 2) Mise à jour éventuelle du score sur la submission
      const patch: TablesUpdate<"test_submissions"> = {};
      if (numericScore !== undefined) patch.numeric_score = numericScore;
      if (maxScore !== undefined) patch.max_score = maxScore;
    
      let submissionRow: Tables<"test_submissions"> | null = null;
    
      if (Object.keys(patch).length > 0) {
        const { data, error } = await sb
          .from("test_submissions")
          .update(patch)
          .eq("id", submissionId)
          .eq("org_id", orgId)
          .select("*")
          .single();
    
        if (error || !data) {
          console.error("[TestRepo.submitAnswers] update submission error", error);
          throw error ?? new Error("Failed to update submission score");
        }
    
        submissionRow = data;
      } else {
        const { data, error } = await sb
          .from("test_submissions")
          .select("*")
          .eq("id", submissionId)
          .eq("org_id", orgId)
          .single();
    
        if (error || !data) {
          console.error("[TestRepo.submitAnswers] fetch submission error", error);
          throw error ?? new Error("Failed to fetch submission");
        }
    
        submissionRow = data;
      }
    
      // 3) Mapping domaine
      const mappedSubmission: TestSubmission = {
        id: submissionRow.id,
        orgId: submissionRow.org_id,
        testId: submissionRow.test_id,
        candidateId: submissionRow.candidate_id,
        offerId: submissionRow.offer_id ?? null,
        submittedBy: submissionRow.submitted_by ?? null,
        submittedAt: submissionRow.submitted_at,
        numericScore: submissionRow.numeric_score ?? null,
        maxScore: submissionRow.max_score ?? null,
      };
    
     const mappedAnswers = (inserted ?? []).map(mapAnswerRow);
    
      return {
        submission: mappedSubmission,
        answers: mappedAnswers,
      };
    },
    

    async listSubmissionsByCandidate(
      candidateId: string,
      orgId: string
    ): Promise<TestSubmission[]> {
      const { data, error } = await sb
        .from("test_submissions")
        .select("*")
        .eq("org_id", orgId)
        .eq("candidate_id", candidateId)
        .order("submitted_at", { ascending: false });
    
      if (error) {
        console.error("[TestRepo.listSubmissionsByCandidate] error", error);
        throw error;
      }
    
      return (data ?? []).map(mapSubmissionRow);
    },

    async getSubmissionWithAnswers(input: {
      submissionId: string;
      orgId: string;
    }): Promise<{
      submission: TestSubmission;
      answers: TestAnswer[];
      test: Test;
      questions: TestQuestion[];
    }> {
      const { submissionId, orgId } = input;
    
      // Submission
      const { data: submissionRow, error: sErr } = await sb
        .from("test_submissions")
        .select("*")
        .eq("id", submissionId)
        .eq("org_id", orgId)
        .maybeSingle();
    
      if (sErr) throw sErr;
      if (!submissionRow) {
        throw new Error("[TestRepo.getSubmissionWithAnswers] submission not found");
      }
    
      // Test
      const { data: testRow, error: tErr } = await sb
        .from("tests")
        .select("*")
        .eq("id", submissionRow.test_id)
        .eq("org_id", orgId)
        .maybeSingle();
    
      if (tErr) throw tErr;
      if (!testRow) {
        throw new Error("[TestRepo.getSubmissionWithAnswers] test not found");
      }
    
      // Questions
      const { data: questionsRows, error: qErr } = await sb
        .from("test_questions")
        .select("*")
        .eq("test_id", submissionRow.test_id)
        .eq("org_id", orgId)
        .order("order_index");
    
      if (qErr) throw qErr;
    
      // Answers
      const { data: answersRows, error: aErr } = await sb
        .from("test_answers")
        .select("*")
        .eq("submission_id", submissionId)
        .eq("org_id", orgId);
    
      if (aErr) throw aErr;
    
      return {
        submission: mapSubmissionRow(submissionRow),
        test: mapTestRow(testRow),
        questions: (questionsRows ?? []).map(mapQuestionRow),
        answers: (answersRows ?? []).map(mapAnswerRow),
      };
    },
    
    async addReview(input: CreateTestReviewInput): Promise<TestReview> {
      const insert: TablesInsert<"test_reviews"> = {
        submission_id: input.submissionId,
        reviewer_id: input.reviewerId,
        overall_comment: input.overallComment ?? null,
        axis_comments: (input.axisComments ?? null) as Record<string, string>[] | null,
      };
    
      const { data, error } = await sb
        .from("test_reviews")
        .insert(insert)
        .select("*")
        .single();
    
      if (error || !data) {
        console.error("[TestRepo.addReview] error", error);
        throw error ?? new Error("Failed to add review");
      }
    
      return {
        id: data.id,
        submissionId: data.submission_id,
        reviewerId: data.reviewer_id,
        overallComment: data.overall_comment ?? null,
        axisComments: (data.axis_comments as Record<string, string>[] | null) ?? null,
        createdAt: data.created_at,
      } as TestReview;
    },
    
    async listReviewsForSubmission(
      submissionId: string,
      _orgId: string
    ): Promise<TestReview[]> {
      const { data, error } = await sb
        .from("test_reviews")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });
    
      if (error) {
        console.error("[TestRepo.listReviewsForSubmission] error", error);
        throw error;
      }
    
      return (
        data?.map((row) => ({
          id: row.id,
          submissionId: row.submission_id,
          reviewerId: row.reviewer_id,
          overallComment: row.overall_comment ?? null,
          axisComments: (row.axis_comments as Record<string, string>[] | null) ?? null,
          createdAt: row.created_at,
        })) as TestReview[] ?? []
      );
    },
  }
}
