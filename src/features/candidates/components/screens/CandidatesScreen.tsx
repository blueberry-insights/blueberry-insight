"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { CandidateTable } from "../table";
import { CreateCandidateModal, EditCandidateNoteModal, DeleteCandidateModal, UpdateCandidateModal } from "../modals";
import { CandidatesFilters } from "../filters";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { OfferListItem } from "@/core/models/Offer";
import { deleteCandidateAction } from "@/app/(app)/candidates/actions";
import { useToast } from "@/shared/hooks/useToast";
import { useFilters } from "@/shared/hooks/useFilters";

type Props = {
  orgId: string;
  initialCandidates: CandidateListItem[];
  offers: OfferListItem[];
};

type CandidateFilters = {
  status: string;
  offerId: string;
};

export function CandidatesScreen({ orgId, initialCandidates, offers }: Props) {
  const [candidates, setCandidates] = useState(initialCandidates);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [candidateToUpdate, setCandidateToUpdate] = useState<CandidateListItem | null>(null);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [candidateToEditNote, setCandidateToEditNote] = useState<CandidateListItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<CandidateListItem | null>(null);
  
  const [deletePending, startDeleteTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatePending, _startUpdateTransition] = useTransition();
  const { toast } = useToast();

  const { filterState, updateFilter, filteredItems: filteredCandidates } = useFilters<
    CandidateFilters,
    CandidateListItem
  >(
    candidates,
    {
      initialState: {
        search: "",
        status: "all",
        offerId: "all",
        sortBy: "date_desc",
      },
    },
    {
      searchFields: (candidate) => [
        candidate.fullName,
        candidate.email ?? "",
        candidate.source ?? "",
        (candidate.tags ?? []).join(" "),
        candidate.note ?? "",
      ],
      customFilters: (candidate, filters) => {
        if (filters.status !== "all" && candidate.status !== filters.status) {
          return false;
        }
        if (filters.offerId !== "all") {
          if (candidate.offerId !== filters.offerId) {
            return false;
          }
        }
        return true;
      },
      sortGetter: (candidate) => candidate.createdAt ?? "",
    }
  );

  // Handlers pour le modal de création
  function handleOpenCreate() {
    setCreateModalOpen(true);
  }

  function handleCloseCreate() {
    setCreateModalOpen(false);
  }

  function handleCreated(newCandidate: CandidateListItem) {
    setCandidates((prev) => [newCandidate, ...prev]);
    setCreateModalOpen(false);
  }

  function handleOpenUpdate(candidate: CandidateListItem) {
    setCandidateToUpdate(candidate);
    setUpdateModalOpen(true);
  }

  function handleCloseUpdate() {
    setUpdateModalOpen(false);
    setCandidateToUpdate(null);
  }

  function handleConfirmUpdate(updatedCandidate: CandidateListItem) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
    setUpdateModalOpen(false);
    setCandidateToUpdate(null);
  }

  function handleOpenEditNote(candidate: CandidateListItem) {
    setCandidateToEditNote(candidate);
    setEditNoteModalOpen(true);
  }

  function handleCloseEditNote() {
    setEditNoteModalOpen(false);
    setCandidateToEditNote(null);
  }

  function handleNoteUpdated(updatedCandidate: CandidateListItem) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
    setEditNoteModalOpen(false);
    setCandidateToEditNote(null);
  }

  function handleOpenDelete(candidate: CandidateListItem) {
    setCandidateToDelete(candidate);
    setDeleteModalOpen(true);
  }

  function handleCloseDelete() {
    setDeleteModalOpen(false);
    setCandidateToDelete(null);
  }

  function handleConfirmDelete() {
    if (!candidateToDelete) return;

    startDeleteTransition(async () => {
      const form = new FormData();
      form.set("candidateId", candidateToDelete.id);
      if (candidateToDelete.cvPath) {
        form.set("cvPath", candidateToDelete.cvPath);
      }

      const res = await deleteCandidateAction(form);

      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la suppression du candidat";
        toast.error({
          title: "Erreur de suppression",
          description: errorMessage,
        });
        setDeleteModalOpen(false);
        setCandidateToDelete(null);
        return;
      }

      const candidateName = candidateToDelete.fullName;
      setCandidates((prev) =>
        prev.filter((c) => c.id !== candidateToDelete.id)
      );

      toast.success({
        title: "Candidat supprimé",
        description: `${candidateName} a été supprimé avec succès.`,
      });

      setDeleteModalOpen(false);
      setCandidateToDelete(null);
    });
  }
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
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un candidat
        </button>
      </div>

      <CandidatesFilters
        search={filterState.search}
        onSearchChange={(v) => updateFilter("search", v)}
        offerFilter={filterState.offerId}
        onOfferFilterChange={(v) => updateFilter("offerId", v)}
        statusFilter={filterState.status}
        onStatusFilterChange={(v) => updateFilter("status", v)}
        sortBy={filterState.sortBy}
        onSortByChange={(v) => updateFilter("sortBy", v)}
        offers={offers}
      />
      <CandidateTable
        candidates={filteredCandidates}
        onEditNote={handleOpenEditNote}
        onDeleteRequest={handleOpenDelete}
        onUpdateRequest={handleOpenUpdate}
        onStatusUpdated={(candidateId, newStatus) => {
          setCandidates((prev) =>
            prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
          );
        }}
        offers={offers}
      />

      <CreateCandidateModal
        open={createModalOpen}
        onClose={handleCloseCreate}
        orgId={orgId}
        onCreated={handleCreated}
        offers={offers}
      />
      <UpdateCandidateModal
        open={updateModalOpen}
        candidate={candidateToUpdate}
        offers={offers}
        orgId={orgId}
        onClose={handleCloseUpdate}
        onUpdated={handleConfirmUpdate}
        isSubmitting={updatePending}
      />
      <EditCandidateNoteModal
        open={editNoteModalOpen}
        candidate={candidateToEditNote}
        onClose={handleCloseEditNote}
        onUpdated={handleNoteUpdated}
      />
      
      <DeleteCandidateModal
        open={deleteModalOpen}
        candidate={candidateToDelete}
        offers={offers}
        onClose={handleCloseDelete}
        onDeleted={handleConfirmDelete}
        isSubmitting={deletePending}
      />
    </div>
  );
}
