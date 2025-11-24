// src/features/candidates/components/CandidateTable.tsx
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  candidates: CandidateListItem[];
  onEditNote?: (candidate: CandidateListItem) => void;
  offers: OfferListItem[];
};

export function CandidateTable({ candidates, onEditNote, offers }: Props) {

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-4">Candidat</th>
            <th className="text-left px-4 py-4">Statut</th>
            <th className="text-left px-4 py-4">Créé le</th>
            <th className="text-left px-4 py-4">Source</th>
            <th className="text-left px-4 py-4">Tags</th>
            <th className="text-left px-4 py-4">Offre</th>
            <th className="text-left px-4 py-4">Note</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {candidates.map((c) => {
            const offer = offers.find((o) => o.id === c.offerId);
            const notePreview = (c.note || "").trim();
            const truncatedNote =
              notePreview.length > 80
                ? notePreview.slice(0, 80) + "…"
                : notePreview;

            return (
              <tr key={c.id} className="border-b last:border-0">
                {/* Candidat : avatar + nom + email */}
                <td className="px-4 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
                      {getInitials(c.fullName)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {c.fullName}
                      </span>
                      {c.email && (
                        <span className="text-xs text-muted-foreground">
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Statut */}
                <td className="px-4 py-6 align-middle">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusClasses(
                      c.status
                    )}`}
                  >
                    {c.status || "—"}
                  </span>
                </td>

                {/* Créé le */}
                <td className="px-4 py-6">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </td>

                {/* Source */}
                <td className="px-4 py-6">
                  {c.source && c.source.trim().length > 0 ? (
                    c.source
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Tags */}
                <td className="px-4 py-6">
                  {c.tags && c.tags.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {c.tags.join(", ")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Offre */}
                <td className="px-4 py-6">
                  {offer ? (
                    <span className="text-xs text-muted-foreground">
                      {offer.title}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                {/* Note */}
                <td className="px-4 py-6 max-w-[220px] whitespace-normal break-words ">
                  {onEditNote ? (
                    <button
                      type="button"
                      onClick={() => onEditNote(c)}
                      className="text-xs text-primary hover:underline text-left w-full"
                    >
                      {notePreview ? (
                        truncatedNote
                      ) : (
                        <span className="italic text-muted-foreground">
                          Ajouter une note
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {notePreview || "—"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {candidates.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-4 text-center text-muted-foreground"
              >
                Aucun candidat pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "new":
      return "bg-emerald-50 text-emerald-700";
    case "interview":
      return "bg-violet-50 text-violet-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    case "hired":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-50 text-slate-700";
  }
}
