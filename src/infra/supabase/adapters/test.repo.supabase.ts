import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/Database";
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
  TestDimensionInput,
  BlueberryCatalogTest,
  MotivationScoringResult,
} from "@/core/models/Test";

type Db = SupabaseClient<Database>;

import { env } from "@/config/env";

const BLUEBERRY_ORG_ID = env.BLUEBERRY_ORG_ID;

type GetTestWithQuestionsResult = {
  test: Tables<"tests">;
  questions: Tables<"test_questions">[];
};

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
    archivedAt: row.archived_at ?? null,
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
    flowId: row.flow_id ?? null,
    flowItemId: row.flow_item_id ?? null,
    completedAt: row.completed_at ?? null,
    scoringResult: (row.scoring_result as MotivationScoringResult | null) ?? null
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
    scoringType: (row.scoring_type as "likert" | "forced_choice" | "desirability" | "none" | null) ?? null,
    isReversed: row.is_reversed ?? null
  };
}

type TestDimension = {
  id: string;
  code: string;
  title: string;
  orderIndex: number;
};

function mapDimensionRow(row: Tables<"test_dimensions">): TestDimension {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    orderIndex: row.order_index,
  };
}

export function makeTestRepo(sb: Db): TestRepo {
  return {
    async listTestsByOrg(orgId: string): Promise<Test[]> {
      const { data, error } = await sb
        .from("tests")
        .select("*")
        .eq("org_id", orgId)
        .is("archived_at", null)
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
        .is("archived_at", null)
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

    async archiveById(input: { orgId: string; testId: string }): Promise<void> {
      const { error } = await sb.rpc("archive_test", {
        p_org_id: input.orgId,
        p_test_id: input.testId,
      });
      if (error) throw error;
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
    async getTestWithQuestionsAnyOrg(testId: string, orgId: string) {
      const { data, error } = await sb.rpc("get_test_with_questions_any_org", {
        p_org_id: orgId,
        p_test_id: testId,
        p_blueberry_org_id: BLUEBERRY_ORG_ID as string,
      });
    
      if (error) throw error;
      if (!data) return null;
    
      const typed = data as GetTestWithQuestionsResult;
      return {
        test: mapTestRow(typed.test),
        questions: (typed.questions ?? []).map(mapQuestionRow),
      };
    },
    async addQuestion(input: CreateQuestionInput): Promise<TestQuestion> {
      const dimensionCode = (input.dimensionCode ?? "").trim();
      if (!dimensionCode) throw new Error("dimensionCode est obligatoire");

      const isScale = input.kind === "scale";
      const isChoice = input.kind === "choice";

      const { data, error } = await sb.rpc("add_test_question", {
        p_org_id: input.orgId,
        p_test_id: input.testId,
        p_dimension_code: dimensionCode,
        p_label: input.label,
        p_kind: input.kind,
        p_min_value: isScale ? (input.minValue ?? undefined) : undefined,
        p_max_value: isScale ? (input.maxValue ?? undefined) : undefined,
        p_options: isChoice ? (input.options ?? null) : null,
        p_is_required: input.isRequired ?? true,
      });

      if (error || !data) {
        console.error("[TestRepo.addQuestion] rpc error", error);
        throw error ?? new Error("Failed to add question");
      }

      return mapQuestionRow(data);
    },

    async updateQuestion(input: UpdateQuestionInput): Promise<TestQuestion> {
      const patch: TablesUpdate<"test_questions"> = {
        org_id: input.orgId,
        label: input.label,
        kind: input.kind,
        min_value: input.kind === "scale" ? (input.minValue ?? null) : null,
        max_value: input.kind === "scale" ? (input.maxValue ?? null) : null,
        options:
          input.kind === "choice"
            ? ((input.options ??
                null) as TablesUpdate<"test_questions">["options"])
            : null,
        is_required: input.isRequired ?? true,
        is_reversed : input.kind === "scale" ? ((input as UpdateQuestionInput & { isReversed?: boolean | null }).isReversed ?? false) : null,
      };

      const { data, error } = await sb
      .from("test_questions")
      .update(patch)
      .eq("id", input.questionId)
      .eq("org_id", input.orgId)
      .select("*"); // <- PAS de single
    
    if (error) {
      console.error("[TestRepo.updateQuestion] error", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      // 99% : RLS a bloqué OU filtre org/id ne matche pas
      throw new Error(
        "Update refusé (0 row). Vérifie RLS sur test_questions (UPDATE) et que org_id/id matchent."
      );
    }
    
    return mapQuestionRow(data[0]);
    

    
    },

    async updateDimensionTitle({ orgId, dimensionId, title }) {
      const { error } = await sb
        .from("test_dimensions")
        .update({ title })
        .eq("org_id", orgId)
        .eq("id", dimensionId);

      if (error) throw error;
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

      if (error) throw error;
    },

    async getSubmissionById({ orgId, submissionId }) {
      const { data, error } = await sb
        .from("test_submissions")
        .select("*")
        .eq("org_id", orgId)
        .eq("id", submissionId)
        .maybeSingle();

      if (error) throw error;
      return data ? mapSubmissionRow(data) : null;
    },

    async getSubmissionByCandidateAndFlowItem(input: {
      orgId: string;
      candidateId: string;
      flowItemId: string;
    }): Promise<TestSubmission | null> {
      const { data, error } = await sb
        .from("test_submissions")
        .select("*")
        .eq("org_id", input.orgId)
        .eq("candidate_id", input.candidateId)
        .eq("flow_item_id", input.flowItemId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if ("code" in error && error.code === "PGRST116") return null;
        throw error;
      }

      return data ? mapSubmissionRow(data) : null;
    },

    async startSubmission(input: StartTestSubmissionInput): Promise<TestSubmission> {
      const insert: TablesInsert<"test_submissions"> = {
        org_id: input.orgId,
        test_id: input.testId,
        candidate_id: input.candidateId,
        offer_id: input.offerId ?? null,
        submitted_by: input.submittedBy ?? null,
        numeric_score: null,
        max_score: null,
        flow_id: input.flowId ?? null,
        flow_item_id: input.flowItemId ?? null,
        completed_at: null,
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

      const payload: TablesInsert<"test_submission_items">[] = items.map((it) => ({
        org_id: orgId,
        submission_id: submissionId,
        question_id: it.questionId,
        display_index: it.displayIndex,
      }));

      const { error } = await sb.from("test_submission_items").insert(payload);
      if (error) throw error;
    },

    async submitAnswers(input: SubmitTestAnswersInput): Promise<{
      submission: TestSubmission;
      answers: TestAnswer[];
    }> {
      const {
        orgId,
        submissionId,
        answers,
        numericScore,
        maxScore,
        scoringResult,
      } = input;
    
      // 0) Guard : submission existe + pas déjà complétée
      const { data: s, error: sErr } = await sb
        .from("test_submissions")
        .select("id, completed_at")
        .eq("id", submissionId)
        .eq("org_id", orgId)
        .maybeSingle();
    
      if (sErr) throw sErr;
      if (!s) throw new Error("Submission introuvable.");
      if (s.completed_at) throw new Error("Cette submission est déjà complétée.");
    
      // ✅ 0bis) Idempotence : on supprime les réponses existantes (safe retry)
      const { error: delErr } = await sb
        .from("test_answers")
        .delete()
        .eq("org_id", orgId)
        .eq("submission_id", submissionId);
    
      if (delErr) {
        console.error("[TestRepo.submitAnswers] delete answers error", delErr);
        throw delErr;
      }
    
      // 1) Insert answers
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
    
      // 2) Update submission (score + completed_at + scoring_result)
      const patch: TablesUpdate<"test_submissions"> = {
        completed_at: new Date().toISOString(),
      };
    
      if (numericScore !== undefined) patch.numeric_score = numericScore;
      if (maxScore !== undefined) patch.max_score = maxScore;
      if (scoringResult !== undefined) {
        patch.scoring_result = scoringResult as MotivationScoringResult;
      }
    
      const { data: updated, error: updErr } = await sb
        .from("test_submissions")
        .update(patch)
        .eq("id", submissionId)
        .eq("org_id", orgId)
        .select("*")
        .single();
    
      if (updErr || !updated) {
        console.error("[TestRepo.submitAnswers] update submission error", updErr);
    
        throw updErr ?? new Error("Failed to update submission");
      }
    
      return {
        submission: mapSubmissionRow(updated),
        answers: inserted.map(mapAnswerRow),
      };
    },
    async listSubmissionsByCandidate(candidateId: string, orgId: string): Promise<TestSubmission[]> {
      const { data, error } = await sb
        .from("test_submissions")
        .select("*")
        .eq("org_id", orgId)
        .eq("candidate_id", candidateId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
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

      const { data: submissionRow, error: sErr } = await sb
        .from("test_submissions")
        .select("*")
        .eq("id", submissionId)
        .eq("org_id", orgId)
        .maybeSingle();

      if (sErr) throw sErr;
      if (!submissionRow) throw new Error("Submission introuvable.");

      const { data: testRow, error: tErr } = await sb
        .from("tests")
        .select("*")
        .eq("id", submissionRow.test_id)
        .eq("org_id", orgId)
        .maybeSingle();

      if (tErr) throw tErr;
      if (!testRow) throw new Error("Test introuvable.");

      const { data: questionsRows, error: qErr } = await sb
        .from("test_questions")
        .select("*")
        .eq("test_id", submissionRow.test_id)
        .eq("org_id", orgId)
        .order("order_index");

      if (qErr) throw qErr;

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

      if (error || !data) throw error ?? new Error("Failed to add review");

      return {
        id: data.id,
        submissionId: data.submission_id,
        reviewerId: data.reviewer_id,
        overallComment: data.overall_comment ?? null,
        axisComments: (data.axis_comments as Record<string, string>[] | null) ?? null,
        createdAt: data.created_at,
      };
    },

    async listReviewsForSubmission(submissionId: string, _orgId: string): Promise<TestReview[]> {
      const { data, error } = await sb
        .from("test_reviews")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        (data ?? []).map((row) => ({
          id: row.id,
          submissionId: row.submission_id,
          reviewerId: row.reviewer_id,
          overallComment: row.overall_comment ?? null,
          axisComments: (row.axis_comments as Record<string, string>[] | null) ?? null,
          createdAt: row.created_at,
        })) as TestReview[]
      );
    },

    async getReviewBySubmissionId(input: { submissionId: string }) {
      const { submissionId } = input;
    
      const { data, error } = await sb
        .from("test_reviews")
        .select("*")
        .eq("submission_id", submissionId)

        .order("created_at", { ascending: false })
        .maybeSingle();
    
      if (error) throw error;
      if (!data) return null;
    
      return {
        id: data.id,
        submissionId: data.submission_id,
        reviewerId: data.reviewer_id,
        overallComment: data.overall_comment ?? null,
        axisComments: (data.axis_comments as Record<string, string>[] | null) ?? null,
        createdAt: data.created_at,
      };
    },
    
    async getSubmissionQuestionsWithDisplayIndex({
      orgId,
      submissionId,
    }: {
      orgId: string;
      submissionId: string;
    }): Promise<(TestQuestion & { displayIndex: number })[]> {
      type JoinedRow = {
        display_index: number;
        question: Tables<"test_questions">;
      };

      const { data, error } = await sb
        .from("test_submission_items")
        .select(
          `
          display_index,
          question:test_questions (*)
        `
        )
        .eq("org_id", orgId)
        .eq("submission_id", submissionId)
        .order("display_index", { ascending: true });

      if (error) throw error;

      return (data as JoinedRow[] | null ?? []).map((row) => ({
        ...mapQuestionRow(row.question),
        displayIndex: row.display_index,
      }));
    },

    async getTestEditorPayload(testId: string, orgId: string) {
      const { data: testRow, error: testError } = await sb
        .from("tests")
        .select("*")
        .eq("id", testId)
        .eq("org_id", orgId)
        .maybeSingle();

      if (testError) throw testError;
      if (!testRow) return null;

      const { data: dimensionRows, error: dErr } = await sb
        .from("test_dimensions")
        .select("*")
        .eq("test_id", testId)
        .eq("org_id", orgId)
        .order("order_index", { ascending: true });

      if (dErr) throw dErr;

      const { data: questionRows, error: qErr } = await sb
        .from("test_questions")
        .select("*")
        .eq("test_id", testId)
        .eq("org_id", orgId)
        .order("dimension_order", { ascending: true })
        .order("order_index", { ascending: true });

      if (qErr) throw qErr;

      return {
        test: mapTestRow(testRow),
        dimensions: (dimensionRows ?? []).map(mapDimensionRow),
        questions: (questionRows ?? []).map(mapQuestionRow),
      };
    },

    async listDimensionsByTest(testId: string, orgId: string): Promise<TestDimensionInput[]> {
      const { data, error } = await sb
        .from("test_dimensions")
        .select("*")
        .eq("test_id", testId)
        .eq("org_id", orgId)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        orgId: row.org_id,
        testId: row.test_id,
        code: row.code,
        title: row.title,
        orderIndex: row.order_index,
        createdAt: row.created_at,
      }));
    },

    async createDimension(input: TestDimensionInput): Promise<TestDimensionInput> {
      let code = input.code;
      let orderIndex = input.orderIndex;

      if (!code || orderIndex == null) {
        const { data: last, error: lastErr } = await sb
          .from("test_dimensions")
          .select("order_index")
          .eq("org_id", input.orgId)
          .eq("test_id", input.testId)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastErr) throw lastErr;

        const next = (last?.order_index ?? 0) + 1;
        orderIndex = orderIndex ?? next;
        code = code ?? `D${next}`;
      }

      const insert: TablesInsert<"test_dimensions"> = {
        org_id: input.orgId,
        test_id: input.testId,
        code,
        title: input.title ?? code,
        order_index: orderIndex ?? 0,
      };

      const { data, error } = await sb
        .from("test_dimensions")
        .insert(insert)
        .select("*")
        .single();

      if (error || !data) throw error ?? new Error("Failed to create dimension");

      return {
        orgId: data.org_id,
        testId: data.test_id,
        code: data.code,
        title: data.title,
        orderIndex: data.order_index,
      };
    },

    async countSubmissionsToReview(input: { orgId: string }): Promise<number> {
      const { orgId } = input;
    
      const { count, error } = await sb
        .from("test_submissions")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .not("completed_at", "is", null);
      // plus tard: .is("reviewed_at", null)
    
      if (error) throw error;
      return count ?? 0;
    },
    async listBlueberryCatalogTests(activeOrgId: string): Promise<BlueberryCatalogTest[]> {
      const { data, error } = await sb.rpc("list_blueberry_test_catalog", {
        p_org_id: activeOrgId,
      });
      if (error) throw error;
    
      return (data ?? []).map((r: { id: string; name: string; type: string }) => ({
        id: r.id,
        name: r.name,
        type: r.type as TestType,
      }));
    },
    
    async areAllFlowTestsCompleted({
      orgId,
      candidateId,
      testFlowItemIds,
    }: {
      orgId: string;
      candidateId: string;
      testFlowItemIds: string[];
    }): Promise<boolean> {
      if (testFlowItemIds.length === 0) return true;

      const { data: subs, error } = await sb
        .from("test_submissions")
        .select("flow_item_id, completed_at")
        .eq("org_id", orgId)
        .eq("candidate_id", candidateId)
        .in("flow_item_id", testFlowItemIds);

      if (error) throw error;

      const completedItemIds = new Set(
        (subs ?? [])
          .filter((s) => s.completed_at !== null)
          .map((s) => s.flow_item_id)
      );

      return testFlowItemIds.every((id) => completedItemIds.has(id));
    },
  };
}