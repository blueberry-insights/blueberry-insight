import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { CandidateStatusBadge } from "@/features/candidates/components/ui";

type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
};

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{typeof value === "string" ? value : value}</span>
    </div>
  );
}

export function CandidateContextSection({ candidate, offer }: Props) {
  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Contexte</h3>
      <div className="space-y-2 text-sm">
        <InfoRow label="Offre" value={offer ? offer.title : "Non associée"} />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-slate-500">Statut</span>
          <CandidateStatusBadge status={candidate.status} />
        </div>
      </div>
    </section>
  );
}

