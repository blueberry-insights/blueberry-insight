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

export function TestQuestionRow({ index, question, onUpdate, onDelete }: Props) {
  const [open, setOpen] = React.useState(false);

  // draft local (uniquement pour le panneau)
  const [label, setLabel] = React.useState(question.label);
  const [context, setContext] = React.useState<string>(question.context ?? "");
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

  // ✅ UI explicite pour scale
  const [isReversed, setIsReversed] = React.useState<boolean>(
    Boolean(question.isReversed)
  );

  const [pendingSave, startSave] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLabel(question.label);
    setContext(question.context ?? "");
    setKind(question.kind);
    setMinValue(question.minValue != null ? String(question.minValue) : "");
    setMaxValue(question.maxValue != null ? String(question.maxValue) : "");
    setOptionsText((question.options ?? []).join("\n"));
    setIsReversed(Boolean(question.isReversed));
    setError(null);
  }, [
    question.id,
    question.label,
    question.context,
    question.kind,
    question.minValue,
    question.maxValue,
    question.options,
    question.isReversed,
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
    setContext(question.context ?? "");
    setKind(question.kind);
    setMinValue(question.minValue != null ? String(question.minValue) : "");
    setMaxValue(question.maxValue != null ? String(question.maxValue) : "");
    setOptionsText((question.options ?? []).join("\n"));
    setIsReversed(Boolean(question.isReversed));
    setError(null);
  }

  function handleSave() {
    setError(null);

    if (!label.trim()) {
      setError("Le libellé est obligatoire.");
      return;
    }

    const normalizedContext = context.trim();

    // normalisation patch
    const patch: Partial<TestQuestion> = {
      label: label.trim(),
      context: normalizedContext ? normalizedContext : null, // ✅
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
      // ✅ only for scale
      isReversed: kind === "scale" ? isReversed : null,
    };

    startSave(async () => {
      try {
        await onUpdate(question.id, patch);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await onDelete(question.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
      }
    });
  }

  const isScale = question.kind === "scale";
  const scaleIsReversed = Boolean(question.isReversed);

  const hasContext = Boolean(question.context?.trim());
  const contextPreview = (question.context ?? "").trim();

  return (
    <>
      <div className="flex items-start justify-between gap-2 p-1">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">{index + 1}.</span>

            <Badge variant="secondary" className="text-[11px]">
              {kindLabel}
            </Badge>

            {/* ✅ Visibilité directe du contexte */}
            {hasContext && (
              <Badge variant="outline" className="text-[11px]">
                Contexte
              </Badge>
            )}

            {isScale && (
              <Badge
                variant={scaleIsReversed ? "destructive" : "outline"}
                className="text-[11px]"
              >
                {scaleIsReversed ? "Inversée" : "Normale"}
              </Badge>
            )}

            {!question.isRequired && (
              <Badge variant="outline" className="text-[11px] text-slate-500">
                Facultative
              </Badge>
            )}
          </div>

          <div className="whitespace-pre-wrap wrap-break-word text-sm font-semibold text-slate-900">
            {question.label}
            <span className="ml-2 text-[10px] text-slate-400">
              Réf. {question.businessCode ?? ""}
            </span>
          </div>

          {/* Optionnel : aperçu 1 ligne du contexte */}
          {hasContext && (
            <div className="text-xs text-slate-500 line-clamp-1">
              Contexte : {contextPreview}
            </div>
          )}

          {isScale && (
            <div className="text-xs text-slate-500">
              Échelle : {question.minValue ?? 0} → {question.maxValue ?? 10}
              {scaleIsReversed ? " • Sens négatif (inversée)" : " • Sens positif"}
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
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
          {/* ✅ Contexte (full width) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Contexte (affiché avant la question)
              </p>
              <span className="text-[11px] text-slate-400">{context.length} caractères</span>
            </div>

            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition resize-y"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={pendingSave || pendingDelete}
              placeholder="Ex : Vous êtes en magasin, il y a 10 clients, un collègue en pause…"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[2fr,1fr,1fr,1fr]">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé"
              disabled={pendingSave || pendingDelete}
            />

            <Select
              value={kind}
              onValueChange={(v) => {
                const next = v as TestQuestion["kind"];
                setKind(next);
                if (next !== "scale") setIsReversed(false);
              }}
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

          {/* ✅ UX : “Sens de l’item” */}
          {kind === "scale" && (
            <div className="rounded-lg border border-slate-200 bg-white/60 p-3 space-y-2">
              <div className="text-sm font-medium text-slate-900">Sens de l’item</div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={`scale-sense-${question.id}`}
                  className="h-4 w-4 mt-0.5"
                  checked={!isReversed}
                  onChange={() => setIsReversed(false)}
                  disabled={pendingSave || pendingDelete}
                />
                <span>
                  <span className="font-medium">Normal</span> — Plus je suis d’accord, plus c’est positif.
                  <span className="block text-[11px] text-slate-500">
                    Exemple : 5 = très bon / 1 = pas bon
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={`scale-sense-${question.id}`}
                  className="h-4 w-4 mt-0.5"
                  checked={isReversed}
                  onChange={() => setIsReversed(true)}
                  disabled={pendingSave || pendingDelete}
                />
                <span>
                  <span className="font-medium">Inversé</span> — Plus je suis d’accord, plus c’est négatif (score inversé automatiquement).
                  <span className="block text-[11px] text-slate-500">
                    Exemple : 5 = mauvais / 1 = bon
                  </span>
                </span>
              </label>

              <p className="text-[11px] text-slate-500">
                Astuce : utilise “Inversé” pour les items formulés négativement (ex: “J’attends qu’on me dise quoi faire.”).
              </p>
            </div>
          )}

          {kind === "choice" && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500">Options (1 par ligne)</p>
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
