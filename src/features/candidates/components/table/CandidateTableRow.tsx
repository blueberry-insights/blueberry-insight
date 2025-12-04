import Link from "next/link";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { CandidateAvatar } from "../ui";
import { CandidateTableActions } from "./CandidateTableActions";
import { StatusDropdown } from "./StatusDropdown";

type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
  onEditNote?: (candidate: CandidateListItem) => void;
  onDeleteRequest?: (candidate: CandidateListItem) => void;
  onUpdateRequest?: (candidate: CandidateListItem) => void;
  onStatusUpdated?: (candidateId: string, newStatus: CandidateListItem["status"]) => void;
};

function truncateNote(note: string | null, maxLength = 80): string {
  const notePreview = (note || "").trim();
  return notePreview.length > maxLength
    ? notePreview.slice(0, maxLength) + "…"
    : notePreview;
}

export function CandidateTableRow({ candidate, offer, onEditNote, onDeleteRequest, onUpdateRequest, onStatusUpdated }: Props) {
  const truncatedNote = truncateNote(candidate.note);

  function handleStatusUpdated(newStatus: CandidateListItem["status"]) {
    onStatusUpdated?.(candidate.id, newStatus);
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-6">
        <Link href={`/candidates/${candidate.id}`}>
          <div className="flex items-center gap-3">
            <CandidateAvatar name={candidate.fullName} size="md" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">
                {candidate.fullName}
              </span>
              {candidate.email && (
                <span className="text-xs text-muted-foreground">
                  {candidate.email}
                </span>
              )}
            </div>
          </div>
        </Link>
      </td>

      <td className="px-4 py-6 align-middle">
        <StatusDropdown
          candidateId={candidate.id}
          currentStatus={candidate.status}
          onStatusUpdated={handleStatusUpdated}
        />
      </td>

      <td className="px-4 py-6">
        {new Date(candidate.createdAt).toLocaleDateString("fr-FR")}
      </td>

      <td className="px-4 py-6">
        {candidate.source && candidate.source.trim().length > 0 ? (
          candidate.source
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-6">
        {candidate.tags && candidate.tags.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {candidate.tags.join(", ")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-6">
        {offer ? (
          <span className="text-xs text-muted-foreground">{offer.title}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>


      <td className="px-4 py-2 align-middle text-slate-600">
        <span
          onClick={() => onEditNote?.(candidate)}
          className="text-xs text-muted-foreground cursor-pointer"
        >
          {truncatedNote}
        </span>
      </td>

      <CandidateTableActions candidate={candidate} onEditNote={onEditNote} onDeleteRequest={onDeleteRequest} onUpdateRequest={onUpdateRequest} />
    </tr>
  );
}

