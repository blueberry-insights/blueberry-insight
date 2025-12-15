
export type TestType = "motivations" | "scenario";

export type TestQuestionKind =
  | "yes_no"
  | "scale"
  | "choice"
  | "long_text";


export interface Test {
  id: string;
  orgId: string;
  name: string;
  type: TestType;
  description?: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string; // ISO date
}

export interface TestQuestion {
  id: string;
  orgId: string;
  testId: string;
  label: string;
  kind: TestQuestionKind;
  minValue?: number | null;
  maxValue?: number | null;
  /**
   * Pour kind = "choice" : liste d'options possibles
   * Pour les autres : normalement null
   */
  options?: string[] | null;
  orderIndex: number;
  isRequired: boolean;
  createdAt: string; // ISO date
}

export interface TestSubmission {
  id: string;
  orgId: string;
  testId: string;
  candidateId: string;
  offerId?: string | null;
  submittedBy?: string | null;
  submittedAt: string; // ISO date

  /**
   * Pour type = "motivations" uniquement (scorable)
   * Pour type = "scenario" → toujours null
   */
  numericScore?: number | null;
  maxScore?: number | null;
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
  axisComments?: TestReviewAxisComment[] | null;
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
  createdBy: string;
}

export interface UpdateTestInput {
  id: string;
  orgId: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
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
    valueText?: string;
    valueNumber?: number;
  }[];
  /**
   * Optionnel : score calculé côté usecase pour type = "motivations"
   * Pour type = "scenario" → ne pas renseigner
   */
  numericScore?: number;
  maxScore?: number;
}

export interface CreateTestReviewInput {
  submissionId: string;
  reviewerId: string;
  overallComment?: string | null;
  axisComments?: TestReviewAxisComment[];
}
