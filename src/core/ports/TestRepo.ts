// core/ports/TestRepo.ts

import type {
  Test,
  TestQuestion,
  TestSubmission,
  TestAnswer,
  TestReview,
  CreateTestInput,
  UpdateTestInput,
  CreateQuestionInput,
  ReorderQuestionsInput,
  StartTestSubmissionInput,
  SubmitTestAnswersInput,
  CreateTestReviewInput,
  UpdateQuestionInput,
  DeleteTestInput,
  CreateSubmissionItemsInput,
  TestDimensionInput,
  BlueberryCatalogTest,
} from "../models/Test";

export interface TestRepo {
  listTestsByOrg(orgId: string): Promise<Test[]>;
  getTestById(id: string, orgId: string): Promise<Test | null>;
  createTest(input: CreateTestInput): Promise<Test>;
  updateTest(input: UpdateTestInput): Promise<Test>;
  archiveById(input: { orgId: string; testId: string }): Promise<void>;
  deleteTest(input: DeleteTestInput): Promise<void>;
  getTestWithQuestions(
    testId: string,
    orgId: string
  ): Promise<{ test: Test; questions: TestQuestion[] } | null>;
  getTestWithQuestionsAnyOrg(testId: string, orgId: string): Promise<{ test: Test; questions: TestQuestion[] } | null>;
  updateDimensionTitle(input: {
    orgId: string;
    dimensionId: string;
    title: string;
  }): Promise<void>;
  listBlueberryCatalogTests(activeOrgId: string): Promise<BlueberryCatalogTest[]>;

  // QUESTIONS
  // ---------------------------------------------------------------------------
  addQuestion(input: CreateQuestionInput): Promise<TestQuestion>;
  updateQuestion(input: UpdateQuestionInput): Promise<TestQuestion>;

  reorderQuestions(input: ReorderQuestionsInput): Promise<void>;
  deleteQuestion(questionId: string, orgId: string): Promise<void>;
  createSubmissionItems(input: CreateSubmissionItemsInput): Promise<void>;
  startSubmission(input: StartTestSubmissionInput): Promise<TestSubmission>;
  submitAnswers(
    input: SubmitTestAnswersInput
  ): Promise<{ submission: TestSubmission; answers: TestAnswer[] }>;
  listSubmissionsByCandidate(
    candidateId: string,
    orgId: string
  ): Promise<TestSubmission[]>;
  getSubmissionWithAnswers(input: {
    submissionId: string;
    orgId: string;
  }): Promise<{
    submission: TestSubmission;
    answers: TestAnswer[];
    test: Test;
    questions: TestQuestion[];
  }>;
  addReview(input: CreateTestReviewInput): Promise<TestReview>;
  listReviewsForSubmission(
    submissionId: string,
    orgId: string
  ): Promise<TestReview[]>;
  getSubmissionQuestionsWithDisplayIndex(input: {
    orgId: string;
    submissionId: string;
  }): Promise<(TestQuestion & { displayIndex: number })[]>;
  getTestEditorPayload(
    testId: string,
    orgId: string
  ): Promise<{
    test: Test;
    questions: TestQuestion[];
    dimensions: {
      id: string;
      code: string;
      title: string;
      orderIndex: number;
    }[];
  } | null>;
  listDimensionsByTest(
    testId: string,
    orgId: string
  ): Promise<TestDimensionInput[]>;
  createDimension(input: TestDimensionInput): Promise<TestDimensionInput>;
  getSubmissionById(input: { orgId: string; submissionId: string }): Promise<TestSubmission | null>;
  getSubmissionByCandidateAndFlowItem(input: {
    orgId: string;
    candidateId: string;
    flowItemId: string;
  }): Promise<TestSubmission | null>;
  countSubmissionsToReview(input: { orgId: string }): Promise<number>;
  getReviewBySubmissionId(input: { submissionId: string }): Promise<TestReview | null>;
  areAllFlowTestsCompleted(input: {
    orgId: string;
    candidateId: string;
    testFlowItemIds: string[];
  }): Promise<boolean>;
}
