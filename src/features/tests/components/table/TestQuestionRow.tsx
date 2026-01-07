"use client";

import * as React from "react";
import type { TestQuestion } from "@/core/models/Test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Trash2, Save, X } from "lucide-react";

type Props = {
  index: number;
  question: TestQuestion;
  onUpdate: (questionId: string, patch: Partial<TestQuestion>) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
};

export function TestQuestionRow({
  index,
  question,
  onUpdate,
  onDelete,
}: Props) {
  const [open, setOpen] = React.useState(false);

  // draft local (uniquement pour le panneau)
  const [label, setLabel] = React.useState(question.label);
  const [kind, setKind] = React.useState<TestQuestion["kind"]>(question.kind);
  const [minValue, setMinValue] = React.useState<string>(
    question.minValue != null ? String(question.minValue) : ""
  );
  const [maxValue, setMaxValue] = React.useState<string>(
    question.maxValue != null ? String(question.maxValue) : ""
  );
  const [optionsText, setOptionsText] = React.useState(
    (question.options ?? []).join("\n")
  );

  const [pendingSave, startSave] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);


  React.useEffect(() => {
    setLabel(question.label);
    setKind(question.kind);
    setMinValue(question.minValue != null ? String(question.minValue) : "");
    setMaxValue(question.maxValue != null ? String(question.maxValue) : "");
    setOptionsText((question.options ?? []).join("\n"));
    setError(null);
  }, [
    question.id,
    question.label,
    question.kind,
    question.minValue,
    question.maxValue,
    question.options,
  ]);

  const kindLabel =
    question.kind === "yes_no"
      ? "Oui / Non"
      : question.kind === "scale"
        ? "Échelle"
        : question.kind === "choice"
          ? "Choix"
          : "Texte libre";

  function resetDraft() {
    setLabel(question.label);
    setKind(question.kind);
    setMinValue(question.minValue != null ? String(question.minValue) : "");
    setMaxValue(question.maxValue != null ? String(question.maxValue) : "");
    setOptionsText((question.options ?? []).join("\n"));
    setError(null);
  }

  function handleSave() {
    setError(null);

    if (!label.trim()) {
      setError("Le libellé est obligatoire.");
      return;
    }

    // normalisation patch
    const patch: Partial<TestQuestion> = {
      label: label.trim(),
      kind,
      minValue:
        kind === "scale" ? (minValue === "" ? null : Number(minValue)) : null,
      maxValue:
        kind === "scale" ? (maxValue === "" ? null : Number(maxValue)) : null,
      options:
        kind === "choice"
          ? optionsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
    };

    startSave(async () => {
      try {
        await onUpdate(question.id, patch);
        setOpen(false);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Erreur lors de la mise à jour"
        );
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await onDelete(question.id);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Erreur lors de la suppression"
        );
      }
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-2 p-1">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">{index + 1}.</span>
            <Badge variant="secondary" className="text-[11px]">
              {kindLabel}
            </Badge>
            {!question.isRequired && (
              <Badge variant="outline" className="text-[11px] text-slate-500">
                Facultative
              </Badge>
            )}
          </div>

          <div className="text-sm font-semibold text-slate-900 truncate">
            {question.label}
            <span className="ml-2 text-[10px] text-slate-400">
            Réf. {question.businessCode ?? ""}
            </span>
          </div>

          {question.kind === "scale" && (
            <div className="text-xs text-slate-500">
              Échelle : {question.minValue ?? 0} → {question.maxValue ?? 10}
            </div>
          )}

          {question.kind === "choice" && question.options?.length ? (
            <div className="text-xs text-slate-500 line-clamp-1">
              Options : {question.options.join(", ")}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => setOpen((v) => !v)}
            disabled={pendingSave || pendingDelete}
            aria-label={open ? "Fermer" : "Modifier"}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-full text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={pendingSave || pendingDelete}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PANEL (inline) */}
      {open && (
        <div className="border-t border-slate-200 p-3 space-y-3">
          <div className="grid gap-2 md:grid-cols-[2fr,1fr,1fr,1fr]">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé"
              disabled={pendingSave || pendingDelete}
            />

            <Select
              value={kind}
              onValueChange={(v) => setKind(v as TestQuestion["kind"])}
              disabled={pendingSave || pendingDelete}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes_no">Oui / Non</SelectItem>
                <SelectItem value="scale">Échelle</SelectItem>
                <SelectItem value="choice">Choix multiple</SelectItem>
                <SelectItem value="long_text">Texte libre</SelectItem>
              </SelectContent>
            </Select>

            {kind === "scale" ? (
              <>
                <Input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Min"
                  disabled={pendingSave || pendingDelete}
                />
                <Input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Max"
                  disabled={pendingSave || pendingDelete}
                />
              </>
            ) : (
              <div className="md:col-span-2" />
            )}
          </div>

          {kind === "choice" && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500">
                Options (1 par ligne)
              </p>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                disabled={pendingSave || pendingDelete}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetDraft();
                setOpen(false);
              }}
              disabled={pendingSave || pendingDelete}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={pendingSave || pendingDelete}
            >
              <Save className="h-4 w-4 mr-2" />
              {pendingSave ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
