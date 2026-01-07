import type { Offer } from "@/core/models/Offer";

type Props = {
  offer: Offer;
};

export function OfferDescriptionSection({ offer }: Props) {
  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Description du poste
      </h2>
      {offer.description ? (
        <p className="whitespace-pre-wrap wrap-break-word text-sm text-slate-700">
          {offer.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune description disponible.
        </p>
      )}
    </section>
  );
}
