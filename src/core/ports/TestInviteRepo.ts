import type {
    TestInvite,
  } from "../models/Test";
  
  export interface CreateTestInviteInput {
    orgId: string;
    candidateId: string;
    testId: string;
    flowItemId?: string;
    expiresAt: string; 
    token: string;
  }

  export interface LinkSubmissionToInviteInput {
    inviteId: string;
    submissionId: string;
  }
  
  export interface MarkInviteCompletedInput {
    inviteId: string;
    completedAt?: string; // si non fourni -> now() côté repo
  }
  export interface TestInviteRepo {
    createInvite(input: CreateTestInviteInput): Promise<TestInvite>;
    getByToken(token: string): Promise<TestInvite | null>;
    listByCandidate(params: { orgId: string; candidateId: string }): Promise<TestInvite[]>;
    linkSubmission(input: LinkSubmissionToInviteInput): Promise<void>;
    markCompleted(input: MarkInviteCompletedInput): Promise<void>;
  }