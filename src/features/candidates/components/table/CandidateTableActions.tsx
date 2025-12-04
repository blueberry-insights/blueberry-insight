import Link from "next/link";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { CandidateListItem } from "@/core/models/Candidate";

type Props = {
  candidate: CandidateListItem;
  onEditNote?: (candidate: CandidateListItem) => void;
  onDeleteRequest?: (candidate: CandidateListItem) => void;
  onUpdateRequest?: (candidate: CandidateListItem) => void;
};

export function CandidateTableActions({
  candidate,
  onEditNote,
  onDeleteRequest,
  onUpdateRequest,
}: Props) {
  return (
    <td className="px-4 py-2 align-middle text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent"
            aria-label="Actions candidat"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-[180px] rounded-lg border border-slate-200 bg-white p-1"
        >
          <DropdownMenuItem asChild>
            <Link
              href={`/candidates/${candidate.id}`}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Voir le candidat</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              if (onUpdateRequest) {
                onUpdateRequest(candidate);
              } else {
                console.error(
                  "[CandidateTableActions] onUpdateRequest is undefined!"
                );
              }
            }}
          >
            <Pencil className="h-4 w-4 text-slate-500" />
            <span>Éditer le candidat</span>
          </DropdownMenuItem>
          {/* Éditer note */}
          <DropdownMenuItem
            onClick={() => onEditNote?.(candidate)}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <Pencil className="h-4 w-4 text-slate-500" />
            <span>Éditer la note</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              if (onDeleteRequest) {
                onDeleteRequest(candidate);
              } else {
                console.error(
                  "[CandidateTableActions] onDeleteRequest is undefined!"
                );
              }
            }}
            className="flex items-center gap-2 text-sm text-red-600 focus:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}
