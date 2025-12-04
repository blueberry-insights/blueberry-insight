"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { CandidateListItem } from "@/core/models/Candidate";
import { CandidateAvatar, CandidateStatusBadge } from "@/features/candidates/components/ui";

type Props = {
  candidates: CandidateListItem[];
};

export function OfferCandidatesSection({ candidates }: Props) {
  if (candidates.length === 0) {
    return (
      <section className="rounded-xl border bg-white px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Candidats associés
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            0
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Aucun candidat n&apos;est encore associé à cette offre.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-900">
          Candidats associés
        </h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {candidates.length}
        </span>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate) => (
          <Link
            key={candidate.id}
            href={`/candidates/${candidate.id}`}
            className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <CandidateAvatar name={candidate.fullName} size="sm" />
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium text-slate-900">
                {candidate.fullName}
              </p>
              {candidate.email && (
                <p className="text-xs text-slate-500">{candidate.email}</p>
              )}
            </div>
            {candidate.status && (
              <CandidateStatusBadge status={candidate.status} />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
