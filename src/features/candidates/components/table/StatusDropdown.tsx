"use client";

import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { candidateStatusValues, type CandidateStatus } from "@/core/models/Candidate";
import { getStatusClasses } from "@/features/candidates/utils/candidateHelpers";
import { updateCandidateStatusAction } from "@/app/(app)/candidates/actions";
import { useToast } from "@/shared/hooks/useToast";
import { ChevronDown } from "lucide-react";

type Props = {
  candidateId: string;
  currentStatus: CandidateStatus | null;
  onStatusUpdated: (status: CandidateStatus | null) => void;
};

export function StatusDropdown({
  candidateId,
  currentStatus,
  onStatusUpdated,
}: Props) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleStatusChange(newStatus: CandidateStatus) {
    if (newStatus === currentStatus) return;

    startTransition(async () => {
      const form = new FormData();
      form.set("id", candidateId);
      form.set("status", newStatus);

      const res = await updateCandidateStatusAction(form);

      if (!res.ok) {
        toast.error({
          title: "Erreur",
          description: res.error ?? "Erreur lors de la mise à jour du statut",
        });
        return;
      }

      toast.success({
        title: "Statut mis à jour",
        description: `Le statut a été mis à jour avec succès.`,
      });

      onStatusUpdated(newStatus);
    });
  }

  const statusClasses = getStatusClasses(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/20 disabled:opacity-50 ${statusClasses}`}
      >
        <span>{currentStatus || "—"}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {candidateStatusValues.map((status) => {
          const itemClasses = getStatusClasses(status);
          const isSelected = status === currentStatus;

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`cursor-pointer ${isSelected ? "bg-accent font-semibold" : ""}`}
            >
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${itemClasses}`}>
                {status}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

