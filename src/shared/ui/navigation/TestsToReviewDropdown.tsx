// src/shared/ui/navigation/TestsToReviewDropdown.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export type TestsToReviewItemVM = {
  candidateId: string;
  candidateName: string;
  testName: string;
  // optionnel si tu veux afficher une date
  completedAt?: string | null;
};

type Props = {
  count: number;
  items: TestsToReviewItemVM[];
  className?: string;
};

export function TestsToReviewDropdown({ count, items, className }: Props) {
  // rien à afficher si aucun test à reviewer
  if (!count || count <= 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={["relative", className].filter(Boolean).join(" ")}
          aria-label="Tests à évaluer"
          title="Tests à évaluer"
        >
          <Bell className="h-5 w-5" />

          {/* pastille + count */}
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Tests à évaluer</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Aucun test à évaluer.
          </div>
        ) : (
          <>
            {items.slice(0, 8).map((it) => (
              <DropdownMenuItem key={`${it.candidateId}-${it.testName}`} asChild>
                <Link
                  href={`/candidates/${it.candidateId}`}
                  className="flex w-full flex-col gap-0.5"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {it.candidateName}
                  </span>
                  <span className="text-xs text-slate-500">{it.testName}</span>
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/candidates" className="text-sm">
                Voir tous les candidats
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
