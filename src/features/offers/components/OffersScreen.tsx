
"use client";

import { useState } from "react";
import type { OfferListItem } from "@/core/models/Offer";
import { OfferTable } from "./OfferTable";
 import { CreateOfferModal } from "./CreateOfferModal";

type Props = {
  orgId: string;
  initialOffers: OfferListItem[];
};

export function OffersScreen({ initialOffers }: Props) {
  const [offers, setOffers] = useState(initialOffers);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Offres</h1>
          <p className="text-sm text-muted-foreground">
            Les offres actives de ton organisation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Créer une offre
        </button>
      </div>

      <OfferTable offers={offers} />

      <CreateOfferModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(offer) => {
          setOffers((prev) => [offer, ...prev]);
        }}
      />
    </div>
  );
}
