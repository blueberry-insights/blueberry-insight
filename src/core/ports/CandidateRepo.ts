import type {
  CandidateListItem,
  CandidateStatus,
} from "@/core/models/Candidate";

export type CreateCandidateInput = {
  orgId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  status?: CandidateStatus;
  source?: string | null;
  tags?: string[];
  note?: string | null;
  offerId?: string | null;
};

export type UpdateCandidateInput = {
  orgId: string;
  candidateId: string;
  fullName: string;
  email:  string ;
  phone?: string | null;
  location?: string | null;
  status?: CandidateStatus;
  source?: string | null;
  tags?: string[];
  note?: string | null;
  offerId?: string | null;
};

export type ArchiveCandidateByIdInput = {
  orgId: string;
  candidateId: string;
  archivedAt?: string | null;
};

export interface CandidateRepo {
  listByOrg(orgId: string): Promise<CandidateListItem[]>;
  create(input: CreateCandidateInput): Promise<CandidateListItem>;
  getById(orgId: string, candidateId: string): Promise<CandidateListItem | null>;
  update(input: UpdateCandidateInput): Promise<CandidateListItem>;
  deleteById(input: { orgId: string; candidateId: string }): Promise<void>;
  updateNote(input: {
    orgId: string;
    candidateId: string;
    note: string | null;
  }): Promise<CandidateListItem>;
  updateCandidateStatus(input: { orgId: string; candidateId: string; status: CandidateStatus }): Promise<void>;
  attachCv(input: {
    orgId: string;
    candidateId: string;
    cvPath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
  }): Promise<CandidateListItem>;
  archiveById(input: ArchiveCandidateByIdInput): Promise<void>;

}
