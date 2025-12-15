import type { Offer } from "@/core/models/Offer";
import { OfferStatusBadge } from "../../ui";

type Props = {
  offer: Offer;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

export function OfferInfoSection({ offer }: Props) {
  const location =
    offer.isRemote && !offer.city
      ? "Full remote"
      : offer.city
      ? `${offer.city}${offer.country ? `, ${offer.country}` : ""}`
      : "Localisation non précisée";

  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Informations générales
      </h2>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-slate-500">Statut</span>
          <OfferStatusBadge status={offer.status} />
        </div>
        <InfoRow label="Type de contrat" value={offer.contractType ?? "Non précisé"} />
        <InfoRow label="Localisation" value={location} />
        <InfoRow
          label="Mode de travail"
          value={offer.isRemote ? "Remote friendly" : "Sur site"}
        />
        <InfoRow
          label="Créée le"
          value={offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("fr-FR") : "Non précisé"}
        />
          <InfoRow
            label="Mise à jour le"
            value={offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString("fr-FR") : "Non précisé"}
          />
      </div>
    </section>
  );
}
