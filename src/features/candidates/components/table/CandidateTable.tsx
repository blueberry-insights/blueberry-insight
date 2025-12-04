import { useMemo } from "react";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { CandidateTableRow } from "./CandidateTableRow";

type Props = {
  candidates: CandidateListItem[];
  onEditNote?: (candidate: CandidateListItem) => void;
  offers: OfferListItem[];
  onDeleteRequest?: (candidate: CandidateListItem) => void;
  onUpdateRequest?: (candidate: CandidateListItem) => void;
  onStatusUpdated?: (
    candidateId: string,
    newStatus: CandidateListItem["status"],
  ) => void;
};

export function CandidateTable({
  candidates,
  onEditNote,
  onDeleteRequest,
  onUpdateRequest,
  onStatusUpdated,
  offers,
}: Props) {
  const offersById = useMemo(() => {
    const map = new Map<string, OfferListItem>();
    for (const offer of offers) {
      map.set(offer.id, offer);
    }
    return map;
  }, [offers]);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-slate-600 bg-[rgba(139,151,255,0.08)]">
          <tr>
            <th className="text-left px-4 py-3">Candidat</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="text-left px-4 py-3">Créé le</th>
            <th className="text-left px-4 py-3">Source</th>
            <th className="text-left px-4 py-3">Tags</th>
            <th className="text-left px-4 py-3">Offre</th>
            <th className="text-left px-4 py-3">Note</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody className="bg-white">
          {candidates.map((candidate) => {
            const offer =
              (candidate.offerId && offersById.get(candidate.offerId)) ?? null;

            return (
              <CandidateTableRow
                key={candidate.id}
                candidate={candidate}
                offer={offer === "" ? null : offer}
                onEditNote={onEditNote}
                onDeleteRequest={onDeleteRequest}
                onUpdateRequest={onUpdateRequest}
                onStatusUpdated={onStatusUpdated}
              />
            );
          })}

          {candidates.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-6 text-center text-sm text-slate-500 bg-slate-50"
              >
                Aucun candidat pour le moment.  
                <span className="block text-[11px] text-slate-400 mt-1">
                  Clique sur &laquo; Nouveau candidat &raquo; pour commencer à
                  alimenter ton vivier.
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
