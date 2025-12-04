import { cn } from "@/lib/utils";

type Props = {
  status: string;
  className?: string;
};

export function OfferStatusBadge({ status, className }: Props) {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[status] ?? "bg-slate-100 text-slate-600",
        className
      )}
    >
      {status}
    </span>
  );
}
