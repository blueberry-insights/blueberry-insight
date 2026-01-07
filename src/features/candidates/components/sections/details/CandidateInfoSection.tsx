import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

export function CandidateInfoSection({ candidate, offer }: Props) {
  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Informations générales
      </h2>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <InfoRow label="Email" value={candidate.email ?? "—"} />
        <InfoRow label="Source" value={candidate.source ?? "—"} />
        <InfoRow label="Location" value={candidate.location ?? "—"} />
        <InfoRow label="Téléphone" value={candidate.phone ?? "—"} />
        
        <InfoRow
          label="Créé le"
          value={new Date(candidate.createdAt).toLocaleDateString("fr-FR")}
        />
        <InfoRow
          label="Offre associée"
          value={offer ? offer.title : "Non associée"}
        />
      </div>
    </section>
  );
}

