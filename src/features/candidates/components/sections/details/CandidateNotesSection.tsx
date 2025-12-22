import type { CandidateListItem } from "@/core/models/Candidate";

type Props = {
  candidate: CandidateListItem;
};

export function CandidateNotesSection({ candidate }: Props) {
  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Notes internes
        </h2>
      </div>
      {candidate.note ? (
        <p className="whitespace-pre-wrap  wrap-break-word text-sm text-slate-800">
          {candidate.note}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune note interne. Ajoute ton ressenti après les entretiens,
          échanges, etc.
        </p>
      )}
    </section>
  );
}

