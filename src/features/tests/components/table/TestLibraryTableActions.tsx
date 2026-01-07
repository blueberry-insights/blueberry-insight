// src/features/tests/table/TestTableActions.tsx
import Link from "next/link";
import {
  Eye,
  Archive,
  MoreHorizontal,
  Copy,
  Pencil,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Test } from "@/core/models/Test";

type Props = {
  test: Test;
  onUpdateRequest?: (test: Test) => void;
  onArchiveRequest?: (test: Test) => void;
  onDuplicateRequest?: (test: Test) => void;
  duplicatePending?: boolean;
  archivePending?: boolean;
};

function ItemButton({
  disabled,
  onAction,
  className,
  children,
}: {
  disabled?: boolean;
  onAction?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAction?.();
      }}
      className={[
        "flex w-full items-center gap-2 text-sm",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className ?? "text-slate-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}


export function TestLibraryTableActions({
  test,
  onUpdateRequest,
  onDuplicateRequest,
  onArchiveRequest,
  duplicatePending,
  archivePending,
}: Props) {
  return (
    <td className="px-4 py-2 align-middle text-right">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent"
            aria-label="Actions test"
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
              href={`/tests/${test.id}`}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Éditer le questionnaire</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <ItemButton
              disabled={!onDuplicateRequest || duplicatePending}
              onAction={() => onDuplicateRequest?.(test)}
            >
              <Copy className="h-4 w-4 text-slate-500" />
              <span>Dupliquer</span>
              {duplicatePending && (
                <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
              )}
            </ItemButton>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <ItemButton
              disabled={!onUpdateRequest}
              onAction={() => onUpdateRequest?.(test)}
            >
              <Pencil className="h-4 w-4 text-slate-500" />
              <span>Modifier le test</span>
            </ItemButton>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <ItemButton
              disabled={!onArchiveRequest || !test.isActive || archivePending}
              onAction={() => {
                if (test.isActive) onArchiveRequest?.(test);
              }}
            >
              <Archive className="h-4 w-4 text-slate-500" />
              <span>{test.isActive ? "Archiver" : "Déjà archivé"}</span>
              {archivePending && (
                <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
              )}
            </ItemButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}
