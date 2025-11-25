import type {
  CandidateListItem,
  CandidateStatus,
} from "@/core/models/Candidate";

export type CreateCandidateInput = {
  orgId: string;
  fullName: string;
  email?: string | null;
  status?: CandidateStatus;
  source?: string | null;
  tags?: string[];
  note?: string | null;
  offerId?: string | null;
};

export interface CandidateRepo {
  listByOrg(orgId: string): Promise<CandidateListItem[]>;
  create(input: CreateCandidateInput): Promise<CandidateListItem>;
  updateNote(input: {
    orgId: string;
    candidateId: string;
    note: string | null;
  }): Promise<CandidateListItem>;
}
