// src/features/offers/components/OfferTable.tsx
import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  offers: OfferListItem[];
  // plus tard: onEdit, onView, etc.
};

export function OfferTable({ offers }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b text-muted-foreground bg-muted/20">
          <tr>
            <th className="px-4 py-2 text-left">Titre</th>
            <th className="px-4 py-2 text-left">Statut</th>
            <th className="px-4 py-2 text-left">Créée le</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {offers.map((o) => {
            return (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-3">{o.title}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">
                  {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            );
          })}

          {offers.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-4 text-center text-muted-foreground"
              >
                Aucune offre pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
