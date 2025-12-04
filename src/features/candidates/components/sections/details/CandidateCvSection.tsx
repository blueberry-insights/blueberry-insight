"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { CandidateListItem } from "@/core/models/Candidate";

type Props = {
  candidate: CandidateListItem;
  onUploadCv: (formData: FormData) => Promise<void>;
  disabled?: boolean;
};

export function CandidateCvSection({ candidate, onUploadCv, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasCv = !!candidate.cvOriginalName;

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("candidateId", candidate.id);
    formData.set("cv", file);

    await onUploadCv(formData);

    e.target.value = "";
  };

  return (
<>
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          CV du candidat
        </h3>
      </header>
    
      <div className="space-y-2 mb-2">
        {hasCv ? (
          <>
            <p className="text-sm text-slate-800">
              <span className="font-medium">Fichier :</span>{" "}
              {candidate.cvOriginalName}
            </p>
            <p className="text-xs text-slate-500">
              Ajouté le{" "}
              {candidate.cvUploadedAt
                ? new Date(candidate.cvUploadedAt).toLocaleString("fr-FR")
                : "—"}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun CV attaché pour le moment.
          </p>
        )}
   

      <input
        ref={fileInputRef}
        type="file"
        name="cv"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full justify-center text-sm"
        onClick={handleClick}
        disabled={disabled}
      >
        {hasCv ? "Remplacer le CV" : "Joindre un CV"}
      </Button>
      </div>
      </>
  );
}
