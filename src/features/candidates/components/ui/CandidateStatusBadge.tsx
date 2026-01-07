import { getStatusClasses } from "@/features/candidates/utils/candidateHelpers";

type Props = {
  status: string | null;
  className?: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  screening: "En évaluation",
  test: "Test en cours",
  interview: "Entretien planifié",
  offer: "Offre proposée",
  hired: "Recruté",
  rejected: "Refusé",
  archived: "Archivé",
};

export function CandidateStatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusClasses(
        status
      )} ${className}`}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || "—"}
    </span>
  );
}

