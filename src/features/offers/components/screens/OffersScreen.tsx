"use client";

import { useState, useTransition } from "react";
import type { OfferListItem } from "@/core/models/Offer";
import { deleteOfferAction } from "@/app/(app)/offers/actions";
import { useToast } from "@/shared/hooks/useToast";
import { useFilters } from "@/shared/hooks/useFilters";
import { OfferTable } from "../Table";
import { CreateOfferModal, UpdateOfferModal, DeleteOfferModal } from "../modals";
import { OffersFilters } from "../filters";

type Props = {
  orgId: string;
  initialOffers: OfferListItem[];
};

type OfferFilters = {
  status: string;
  contractType: string;
  remote: string;
};

export function OffersScreen({ initialOffers }: Props) {
  const [offers, setOffers] = useState(initialOffers);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [offerToUpdate, setOfferToUpdate] = useState<OfferListItem | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<OfferListItem | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const { filterState, updateFilter, filteredItems: filteredOffers } = useFilters<
    OfferFilters,
    OfferListItem
  >(
    offers,
    {
      initialState: {
        search: "",
        status: "all",
        contractType: "all",
        remote: "all",
        sortBy: "date_desc",
      },
    },
    {
      searchFields: (offer) => [
        offer.title,
        offer.description ?? "",
        offer.city ?? "",
        offer.country ?? "",
        offer.contractType ?? "",
      ],
      customFilters: (offer, filters) => {
        if (filters.status !== "all" && offer.status !== filters.status) {
          return false;
        }

        if (
          filters.contractType !== "all" &&
          offer.contractType !== filters.contractType
        ) {
          return false;
        }

        if (filters.remote === "remote" && !offer.isRemote) {
          return false;
        }
        if (filters.remote === "on_site" && offer.isRemote) {
          return false;
        }

        return true;
      },
      sortGetter: (offer) => offer.updatedAt ?? offer.createdAt ?? "",
    }
  );


  function handleOpenUpdate(offer: OfferListItem) {
    setOfferToUpdate(offer);
    setUpdateModalOpen(true);
  }

  function handleCloseUpdate() {
    setUpdateModalOpen(false);
    setOfferToUpdate(null);
  }

  function handleOpenDelete(offer: OfferListItem) {
    setOfferToDelete(offer);
    setDeleteModalOpen(true);
  }

  function handleCloseDelete() {
    setDeleteModalOpen(false);
    setOfferToDelete(null);
  }

  function handleConfirmDelete() {
    if (!offerToDelete) return;

    startDeleteTransition(async () => {
      const form = new FormData();
      form.set("offerId", offerToDelete.id);

      const res = await deleteOfferAction(form);

      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la suppression de l'offre";
        toast.error({
          title: "Erreur de suppression",
          description: errorMessage,
        });
        setDeleteModalOpen(false);
        setOfferToDelete(null);
        return;
      }

      const offerTitle = offerToDelete.title;
      setOffers((prev) => prev.filter((o) => o.id !== offerToDelete.id));

      toast.success({
        title: "Offre supprimée",
        description: `${offerTitle} a été supprimée avec succès.`,
      });

      setDeleteModalOpen(false);
      setOfferToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Offres</h1>
          <p className="text-sm text-muted-foreground">
            {filteredOffers.length} offre{filteredOffers.length > 1 ? "s" : ""} {offers.length !== filteredOffers.length ? `sur ${offers.length}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Créer une offre
        </button>
      </div>

      <OffersFilters
        search={filterState.search}
        onSearchChange={(v) => updateFilter("search", v)}
        statusFilter={filterState.status}
        onStatusFilterChange={(v) => updateFilter("status", v)}
        contractTypeFilter={filterState.contractType}
        onContractTypeFilterChange={(v) => updateFilter("contractType", v)}
        remoteFilter={filterState.remote}
        onRemoteFilterChange={(v) => updateFilter("remote", v)}
        sortBy={filterState.sortBy}
        onSortByChange={(v) => updateFilter("sortBy", v)}
      />

      <OfferTable 
        offers={filteredOffers} 
        onEditRequest={handleOpenUpdate}
        onDeleteRequest={handleOpenDelete} 
      />

      <CreateOfferModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(offer) => {
          setOffers((prev) => [offer, ...prev]);
        }}
      />

      <UpdateOfferModal
        open={updateModalOpen}
        onClose={handleCloseUpdate}
        offer={offerToUpdate}
        onUpdated={(updatedOffer) => {
          setOffers((prev) =>
            prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o))
          );
        }}
      />

      <DeleteOfferModal
        open={deleteModalOpen}
        offer={offerToDelete}
        isSubmitting={deletePending}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
