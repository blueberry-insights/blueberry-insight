export type CandidateId = string;

export type CreateCandidateInput = {
  orgId: string;
  fullName: string;
  email: string;
  skills?: string[];
  offerId?: string | null;
  cvUrl?: string | null;
  createdBy: string;
};

export type CandidateListItem = {
  id: CandidateId;
  fullName: string;
  createdAt: string;
};

export interface CandidateRepo {
  insertCandidate(input: CreateCandidateInput): Promise<{ id: CandidateId }>;
  listByOrg(orgId: string): Promise<CandidateListItem[]>;
}
