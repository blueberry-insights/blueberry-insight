"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OfferListItem } from "@/core/models/Offer";
import { Eye, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { OfferStatusBadge } from "../ui";

type Props = {
  offers: OfferListItem[];
  onSelect?: (offer: OfferListItem) => void; // optionnel, pour plus tard
  onEditRequest: (offer: OfferListItem) => void;
  onDeleteRequest: (offer: OfferListItem) => void;
};

export function OfferTable({
  offers,
  onEditRequest,
  onDeleteRequest,
}: Props) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[rgba(139,151,255,0.08)] text-slate-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Offre</th>
            <th className="px-4 py-3 text-left">Statut</th>
            <th className="px-4 py-3 text-left">Candidats</th>
            <th className="px-4 py-3 text-left">Mise à jour</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {offers.map((o) => {
            const location =
              o.isRemote && !o.city
                ? "Full remote"
                : o.city
                  ? `${o.city}${o.country ? `, ${o.country}` : ""}`
                  : "Localisation non précisée";

            return (
              <tr
                key={o.id}
                className="border-b last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/offers/${o.id}`}
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-900 hover:text-primary transition">
                        {o.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {location}
                        {o.contractType ? ` · ${o.contractType}` : ""}
                      </span>
                      {o.responsibleUserName && (
                        <span className="text-[11px] text-slate-400">
                          Créée par {o.responsibleUserName}
                        </span>
                      )}
                    </div>
                  </Link>
                </td>

                {/* Statut */}
                <td className="px-4 py-3 align-top">
                  <OfferStatusBadge status={o.status} />
                </td>

                {/* Nombre de candidats */}
                <td className="px-4 py-3 align-top text-slate-600">
                  {o.candidateCount}
                </td>

                {/* Date de mise à jour */}
                <td className="px-4 py-3 align-top text-slate-500 text-xs">
                  {new Date(o.updatedAt ?? o.createdAt ?? new Date()).toLocaleDateString(
                    "fr-FR",
                    { day: "2-digit", month: "short", year: "numeric" }
                  )}
                </td>

                <td className="px-4 py-3 align-top text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 hover:bg-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-slate-600" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/offers/${o.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Voir l&apos;offre</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onEditRequest(o)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Éditer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700"
                        onSelect={() => onDeleteRequest(o)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}

          {offers.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-slate-500 text-sm"
              >
                Aucune offre pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
