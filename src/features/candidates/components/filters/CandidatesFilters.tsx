"use client";

import * as React from "react";
import {
  Search,
  ChevronsUpDown,
  Check,
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { OfferListItem } from "@/core/models/Offer";
import { candidateStatusValues } from "@/core/models/Candidate";

type SortBy = "date_desc" | "date_asc";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  offerFilter: string; // "all" ou offerId
  onOfferFilterChange: (value: string) => void;
  statusFilter: string; // "all" ou un des candidateStatusValues
  onStatusFilterChange: (value: string) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  offers: OfferListItem[];
};

export function CandidatesFilters({
  search,
  onSearchChange,
  offerFilter,
  onOfferFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  offers,
}: Props) {
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white px-4 py-4">
    {/* Header filtre */}
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
          onOfferFilterChange("all");
          onStatusFilterChange("all");
          onSortByChange("date_desc");
        }}
      >
        Réinitialiser
      </Button>
    </div>
  
    <div className="flex flex-wrap items-center gap-3">
  
      {/* Recherche */}
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="h-6 flex-1 border-0 bg-transparent px-0 py-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
  
      <OfferCombobox
        offers={offers}
        value={offerFilter}
        onChange={onOfferFilterChange}
      />
  
      {/* Statut */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="min-w-[160px] rounded-md border-slate-200 bg-white text-sm">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {candidateStatusValues.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
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

type OfferComboboxProps = {
  offers: OfferListItem[];
  value: string; // "all" ou offerId
  onChange: (value: string) => void;
};

function OfferCombobox({ offers, value, onChange }: OfferComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOffer =
    value === "all" ? null : offers.find((o) => o.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[190px] justify-between rounded-lg border-slate-200 bg-white text-sm"
        >
          <span className="truncate">
            {selectedOffer ? selectedOffer.title : "Toutes les offres"}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Filtrer les offres..." />
          <CommandList>
            <CommandEmpty>Aucune offre trouvée.</CommandEmpty>

            <CommandItem
              value="all"
              onSelect={() => {
                onChange("all");
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === "all" ? "opacity-100" : "opacity-0",
                )}
              />
              Toutes les offres
            </CommandItem>

            {offers.map((offer) => (
              <CommandItem
                key={offer.id}
                value={offer.title}
                onSelect={() => {
                  onChange(offer.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === offer.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{offer.title}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
