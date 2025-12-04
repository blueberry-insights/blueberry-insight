"use client";

import * as React from "react";
import {
  Search,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { offerStatusValues } from "@/core/models/Offer";

type SortBy = "date_desc" | "date_asc";

const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance"] as const;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string; // "all" ou un des offerStatusValues
  onStatusFilterChange: (value: string) => void;
  contractTypeFilter: string; // "all" ou un des CONTRACT_TYPES
  onContractTypeFilterChange: (value: string) => void;
  remoteFilter: string; // "all" | "remote" | "on_site"
  onRemoteFilterChange: (value: string) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
};

export function OffersFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  contractTypeFilter,
  onContractTypeFilterChange,
  remoteFilter,
  onRemoteFilterChange,
  sortBy,
  onSortByChange,
}: Props) {
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Filtres
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-700"
          onClick={() => {
            onSearchChange("");
            onStatusFilterChange("all");
            onContractTypeFilterChange("all");
            onRemoteFilterChange("all");
            onSortByChange("date_desc");
          }}
        >
          Réinitialiser
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="h-6 flex-1 border-0 bg-transparent px-0 py-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Statut */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="min-w-[160px] rounded-md border-slate-200 bg-white text-sm">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {offerStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type de contrat */}
        <Select value={contractTypeFilter} onValueChange={onContractTypeFilterChange}>
          <SelectTrigger className="min-w-[160px] rounded-md border-slate-200 bg-white text-sm">
            <SelectValue placeholder="Tous les contrats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les contrats</SelectItem>
            {CONTRACT_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {ct}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Remote */}
        <Select value={remoteFilter} onValueChange={onRemoteFilterChange}>
          <SelectTrigger className="min-w-[160px] rounded-md border-slate-200 bg-white text-sm">
            <SelectValue placeholder="Tous les modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modes</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="on_site">Sur site</SelectItem>
          </SelectContent>
        </Select>

        {/* Tri */}
        <Select
          value={sortBy}
          onValueChange={(v) =>
            onSortByChange(v === "date_asc" ? "date_asc" : "date_desc")
          }
        >
          <SelectTrigger className="relative min-w-[170px] rounded-md border-slate-200 bg-white text-sm pr-10">
            <div className="flex items-center gap-2">
              {sortBy === "date_desc" ? (
                <ArrowDownWideNarrow className="h-4 w-4 text-slate-500" />
              ) : (
                <ArrowUpWideNarrow className="h-4 w-4 text-slate-500" />
              )}
              <SelectValue placeholder="Trier par date" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Récent → Ancien</SelectItem>
            <SelectItem value="date_asc">Ancien → Récent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
