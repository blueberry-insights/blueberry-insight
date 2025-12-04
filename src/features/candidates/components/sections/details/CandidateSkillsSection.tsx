import type { CandidateListItem } from "@/core/models/Candidate";

type Props = {
  candidate: CandidateListItem;
};

export function CandidateSkillsSection({ candidate }: Props) {
  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Compétences
      </h2>
      {candidate.tags && candidate.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {candidate.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-800"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune compétence renseignée pour le moment.
        </p>
      )}
    </section>
  );
}

