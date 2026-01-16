export type TestType = "motivations" | "scenario";
export type BlueberryCatalogTest = {
  id: string;
  name: string;
  type: TestType;
};

export type MotivationLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type MotivationDimensionScore = {
  dimensionCode: string;
  average: number;
  level: MotivationLevel;
};

export type MotivationScoringResult = {
  version: "v2.5";
  global: {
    average: number;
    level: MotivationLevel;
  };
  dimensions: MotivationDimensionScore[];
};

export type TestQuestionKind = "yes_no" | "scale" | "choice" | "long_text";

export type TestInviteStatus = "pending" | "completed" | "revoked" | "expired";

export interface Test {
  id: string;
  orgId: string;
  name: string;
  type: TestType;
  description?: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string; // IS
  archivedAt?: string | null;
}

export type TestRef = Pick<Test, "id" | "name" | "type">;

export interface TestInvite {
  id: string;
  orgId: string;
  candidateId: string;
  testId: string;
  flowItemId?: string | null;

  token: string;
  status: TestInviteStatus;

  expiresAt: string;
  createdAt: string;
  sentAt?: string | null;
  completedAt?: string | null;

  submissionId?: string | null;
}

export interface TestQuestion {
  id: string;
  orgId: string;
  testId: string;
  label: string;
  kind: TestQuestionKind;
  minValue?: number | null;
  maxValue?: number | null;
  options?: string[] | null;
  orderIndex: number;
  isRequired: boolean;
  createdAt: string; // ISO
  businessCode?: string | null; // ex: "D1.1"
  dimensionCode?: string | null; // ex: "D1"
  dimensionOrder?: number | null;
  scoringType?: "likert" | "forced_choice" | "desirability" | "none" | null;
  isReversed?: boolean | null;
}

export interface TestSubmission {
  id: string;
  orgId: string;
  testId: string;
  candidateId: string;
  offerId?: string | null;
  submittedBy?: string | null;
  submittedAt: string; // ISO date
  numericScore?: number | null;
  maxScore?: number | null;
  flowId?: string | null;
  flowItemId?: string | null;
  completedAt?: string | null;
  scoringResult?: MotivationScoringResult | null;
}

export interface TestAnswer {
  id: string;
  orgId: string;
  submissionId: string;
  questionId: string;

  /**
   * yes_no, choice, long_text → valueText
   * scale → valueNumber (optionnellement doublé en valueText si besoin)
   */
  valueText?: string | null;
  valueNumber?: number | null;

  createdAt: string; // ISO date
}

/**
 * Review qualitative d'une submission, jamais de scoring numérique.
 * Utilisé notamment pour les scénarios contextuels.
 */
export interface TestReviewAxisComment {
  axisId: string;
  comment?: string | null;
}

export interface TestReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  overallComment?: string | null;
  axisComments?: Record<string, string>[] | null;
  createdAt: string; // ISO date
}

// -----------------------------------------------------------------------------
// Payloads d'input pour les usecases / repos
// -----------------------------------------------------------------------------

export interface CreateTestInput {
  orgId: string;
  name: string;
  type: TestType;
  description?: string | null;
  isActive: boolean;
  createdBy: string;
}

export interface UpdateTestInput {
  id: string;
  orgId: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface DeleteTestInput {
  testId: string;
  orgId: string;
}

export interface ArchiveTestInput {
  testId: string;
  orgId: string;
}

export interface CreateQuestionInput {
  orgId: string;
  testId: string;
  label: string;
  kind: TestQuestionKind;
  minValue?: number;
  maxValue?: number;
  options?: string[];
  orderIndex?: number;
  isRequired?: boolean;
  businessCode?: string | null;
  dimensionCode?: string | null;
  dimensionOrder?: number | null;
}

export interface UpdateQuestionInput {
  orgId: string;
  questionId: string;
  label: string;
  kind: TestQuestionKind;
  minValue?: number | null;
  maxValue?: number | null;
  options?: string[] | null;
  isRequired?: boolean;
}

export interface ReorderQuestionsInput {
  testId: string;
  orgId: string;
  order: {
    questionId: string;
    orderIndex: number;
  }[];
}

export interface StartTestSubmissionInput {
  orgId: string;
  testId: string;
  candidateId: string;
  offerId?: string;
  submittedBy?: string; // user id si le candidat est dans auth.users, sinon null
  flowId?: string;
  flowItemId?: string;
}

/**
 * Réponses envoyées par le candidat pour un test donné.
 * On laisse la logique de validation à un usecase (cohérence kind/value).
 */
export interface SubmitTestAnswersInput {
  orgId: string;
  submissionId: string;
  answers: {
    questionId: string;
    valueNumber?: number | null;
    valueText?: string | null;
  }[];
  /**
   * Optionnel : score calculé côté usecase pour type = "motivations"
   * Pour type = "scenario" → ne pas renseigner
   */
  numericScore?: number;
  maxScore?: number;
  scoringResult?: MotivationScoringResult | null;
}

export interface CreateTestReviewInput {
  submissionId: string;
  reviewerId: string;
  overallComment?: string | null;
  axisComments?: TestReviewAxisComment[];
}

export interface CreateSubmissionItemsInput {
  orgId: string;
  submissionId: string;
  items: {
    questionId: string;
    displayIndex: number;
  }[];
}

export interface TestDimensionInput {
  orgId: string;
  testId: string;
  code: string;
  title: string;
  orderIndex: number;
}
