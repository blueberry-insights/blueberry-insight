// src/core/models/Candidate.ts
export const candidateStatusValues = [
  "new",        // Candidat vient d’entrer dans le vivier
  "screening",  // CV en cours de lecture / short-list
  "test",       // Test envoyé / en cours
  "interview",  // Entretien planifié / en cours
  "offer",      // Offre faite
  "hired",      // Embauché
  "archived",   //
] as const;

export type CandidateStatus = (typeof candidateStatusValues)[number];

export type CandidateListItem = {
  id: string;
  fullName: string;
  email: string | null;
  status: CandidateStatus | null;
  source: string | null;
  offerId: string | null;
  tags: string[];
  note: string | null;
  createdAt: string;
};
