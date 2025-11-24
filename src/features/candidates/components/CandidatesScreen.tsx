"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CandidateTable } from "./CandidateTable";
import { CreateCandidateModal } from "./CreateCandidateModal";
import { EditCandidateNoteModal } from "./EditCandidateNoteModal";

import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";

type Props = {
  orgId: string;
  initialCandidates: CandidateListItem[];
  offers: OfferListItem[];
};

export function CandidatesScreen({ orgId, initialCandidates, offers }: Props) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateListItem | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Candidats</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des candidats de ton organisation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un candidat
        </button>
      </div>

      <CandidateTable
        candidates={candidates}
        onEditNote={(candidate) => setEditing(candidate)}
        offers={offers}
      />

      <CreateCandidateModal
        open={open}
        onClose={() => setOpen(false)}
        orgId={orgId}
        onCreated={(newCandidate) => {
          setCandidates((prev) => [newCandidate, ...prev]);
          setOpen(false);
        }}
      />
      <EditCandidateNoteModal
        key={editing?.id ?? "none"}
        candidate={editing}
        onClose={() => setEditing(null)}
        onUpdated={(updated) => {
          setCandidates((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          setEditing(null);
        }}
      />
   
    </div>
  );
}
