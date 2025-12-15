"use client";

import { useMemo, useState, useTransition } from "react";
import type { CandidateListItem } from "@/core/models/Candidate";
import { updateCandidateNoteAction } from "@/app/(app)/candidates/actions";
import { FormSubmit } from "@/shared/ui/forms";
import { useToast } from "@/shared/hooks/useToast";

type Props = {
  open: boolean;
  candidate: CandidateListItem | null;
  onClose: () => void;
  onUpdated: (c: CandidateListItem) => void;
};

export function EditCandidateNoteModal({
  open,
  candidate,
  onClose,
  onUpdated,
}: Props) {
  const [note, setNote] = useState("");
  const [syncedForCandidateId, setSyncedForCandidateId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const shouldSync = useMemo(() => {
    if (!open) return false;
    if (!candidate) return false;
    return syncedForCandidateId !== candidate.id;
  }, [open, candidate, syncedForCandidateId]);

  if (shouldSync) {
    setNote(candidate?.note ?? "");
    setError(null);
    if (candidate) {
      setSyncedForCandidateId(candidate.id);
    }
  }

  if (!open || !candidate) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const form = new FormData();
      form.set("id", candidate.id);
      form.set("note", note);

      const res = await updateCandidateNoteAction(form);

      if (!res.ok) {
        const errorMessage = res.error ?? "Erreur lors de la mise à jour";
        setError(errorMessage);
        toast.error({
          title: "Erreur de mise à jour",
          description: errorMessage,
        });
        return;
      }

      toast.success({
        title: "Note mise à jour",
        description: `La note pour ${candidate?.fullName ?? "le candidat"} a été mise à jour avec succès.`,
      });

      onUpdated(res.candidate);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Note pour {candidate.fullName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:underline"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full resize-y rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormSubmit>{pending ? "Enregistrement..." : "Enregistrer"}</FormSubmit>
        </form>
      </div>
    </div>
  );
}
