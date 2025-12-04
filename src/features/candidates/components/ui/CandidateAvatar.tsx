import { getInitials } from "@/features/candidates/utils/candidateHelpers";

type Props = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-10 w-10 text-xs",
};

export function CandidateAvatar({ name, size = "md", className = "" }: Props) {
  return (
    <div
      className={`rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-700 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

