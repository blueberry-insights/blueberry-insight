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
  } from "../models/Test";
  
  export interface TestRepo {
    // ---------------------------------------------------------------------------
    // TESTS (questionnaires / scénarios)
    // ---------------------------------------------------------------------------
  
    listTestsByOrg(orgId: string): Promise<Test[]>;
    getTestById(id: string, orgId: string): Promise<Test | null>;
    createTest(input: CreateTestInput): Promise<Test>;
    updateTest(input: UpdateTestInput): Promise<Test>;
    archiveTest(id: string, orgId: string): Promise<void>;

    getTestWithQuestions(
      testId: string,
      orgId: string
    ): Promise<{ test: Test; questions: TestQuestion[] } | null>;
    
    // ---------------------------------------------------------------------------
    // QUESTIONS
    // ---------------------------------------------------------------------------
    addQuestion(input: CreateQuestionInput): Promise<TestQuestion>;
    updateQuestion(input: {
      id: string;
      orgId: string;
      label?: string;
      minValue?: number;
      maxValue?: number;
      options?: string[];
      isRequired?: boolean;
    }): Promise<TestQuestion>;
    reorderQuestions(input: ReorderQuestionsInput): Promise<void>;
    deleteQuestion(questionId: string, orgId: string): Promise<void>;
    startSubmission(
      input: StartTestSubmissionInput
    ): Promise<TestSubmission>;
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
  }
  