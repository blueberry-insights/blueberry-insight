import { getStatusClasses } from "../utils/candidateHelpers";

type Props = {
  status: string | null;
  className?: string;
};

export function CandidateStatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusClasses(
        status
      )} ${className}`}
    >
      {status || "—"}
    </span>
  );
}

