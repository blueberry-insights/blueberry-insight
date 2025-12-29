export const candidateStatusValues = [
  "new",
  "screening",
  "test",
  "interview",
  "offer",
  "hired",
  "archived",
  "rejected",
] as const;

export type CandidateStatus = (typeof candidateStatusValues)[number];

export type CandidateListItem = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  candidateRef: string;
  status: CandidateStatus | null;
  source: string | null;
  offerId: string | null;
  tags: string[];
  note: string | null;
  createdAt: string;
  cvPath?: string | null;
  cvOriginalName?: string | null;
  cvMimeType?: string | null;
  cvSizeBytes?: number | null;
  cvUploadedAt?: string | null;
};
