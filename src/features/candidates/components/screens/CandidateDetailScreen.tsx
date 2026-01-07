"use client";

import { useState, useTransition, useMemo } from "react";
import type { CandidateListItem } from "@/core/models/Candidate";
import type { TestSubmission } from "@/core/models/Test";
import type { OfferListItem } from "@/core/models/Offer";
import type { Test } from "@/core/models/Test";

import {
  uploadCandidateCvAction,
  updateCandidateAction,
  sendCandidateTestInviteAction,
} from "@/app/(app)/candidates/[id]/actions";

import { DetailTwoColumnLayout } from "@/shared/ui/layout";
import { Button } from "@/components/ui/button";
import { CandidateAvatar, CandidateStatusBadge } from "../ui";

import {
  CandidateInfoSection,
  CandidateSkillsSection,
  CandidateCvSection,
  CandidateNotesSection,
  CandidateContextSection,
} from "../sections/details";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AppModal } from "@/shared/ui/AppModal";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "@/shared/hooks/useToast";
import type { CandidateInviteView } from "@/core/usecases/tests/invites/listCandidateInvites";
import type { TestFlowItemInfo } from "@/core/usecases/tests/flows/getTestFlowItemForOffer";

type SubmissionScoreVM = {
  isScored: boolean;
  scoreLabel: string;
  ratio?: number; // 0..1
  badge?: "Excellent" | "Bon" | "Moyen" | "Faible";
};

type Props = {
  candidate: CandidateListItem;
  offer: OfferListItem | null;
  allOffers: OfferListItem[] | null;
  tests: Test[];
  testInvites: CandidateInviteView[];
  testFlowInfoMap?: Record<string, TestFlowItemInfo>;
  testSubmissions: TestSubmission[];
  latestCompletedSubmission: TestSubmission | null;
  latestScoreVM: SubmissionScoreVM | null;
};

export function CandidateDetailScreen({
  candidate,
  allOffers,
  tests,
  testInvites,
  testFlowInfoMap = {},
  testSubmissions,
  latestCompletedSubmission,
  latestScoreVM,
}: Props) {
  const [currentCandidate, setCurrentCandidate] = useState(candidate);
  const [isPending, startTransition] = useTransition();

  const [isSendTestOpen, setIsSendTestOpen] = useState(false);
  const [isSendingTest, startSendTestTransition] = useTransition();
  
  // Calculer la valeur par défaut avec useMemo
  const defaultTestId = useMemo(() => {
    return tests?.length === 1 ? tests[0].id : "";
  }, [tests]);
  
  // Initialiser l'état avec la valeur calculée
  const [selectedTestId, setSelectedTestId] = useState<string>(() => defaultTestId);
  
  // Calculer la valeur effective à utiliser dans le rendu
  // Si l'utilisateur a sélectionné un test qui existe toujours, on l'utilise
  // Sinon, on utilise la valeur par défaut
  const effectiveTestId = useMemo(() => {
    if (selectedTestId && tests?.some(t => t.id === selectedTestId)) {
      return selectedTestId;
    }
    return defaultTestId;
  }, [selectedTestId, defaultTestId, tests]);
  
  const [expiresInDays, setExpiresInDays] = useState<string>("3");

  // ✅ Nouveau : stockage du dernier lien généré
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInviteTestName, setLastInviteTestName] = useState<string | null>(
    null
  );
 
  const offerSelectValue = currentCandidate.offerId ?? "none";
  const ratio = latestScoreVM?.ratio ?? 0;
  const pct = Math.round(ratio * 100);

  // clamp: évite que le label touche les bords
  const markerLeft = Math.min(95, Math.max(5, pct));

  const barColor =
    pct >= 75
      ? "bg-emerald-600"
      : pct >= 50
        ? "bg-blue-600"
        : pct >= 25
          ? "bg-amber-500"
          : "bg-rose-600";

  async function handleUploadCv(formData: FormData) {
    startTransition(async () => {
      const result = await uploadCandidateCvAction(formData);
      if (result.ok) {
        setCurrentCandidate(result.candidate);
      } else {
        console.error("[handleUploadCv] error", result.error);
        toast.error({
          title: "Erreur",
          description: result.error,
        });
      }
    });
  }

  async function handleAssociateOffer(offerId: string | null) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", currentCandidate.id);
      formData.set("offerId", offerId || "none");
      const result = await updateCandidateAction(formData);
      if (result.ok) {
        setCurrentCandidate(result.candidate);
        toast.success({
          title: "Offre mise à jour",
          description: offerId
            ? "L'offre a été associée au candidat"
            : "L'offre a été désassociée du candidat",
        });
      } else {
        console.error("[handleAssociateOffer] error", result.error);
        toast.error({
          title: "Erreur",
          description: result.error,
        });
      }
    });
  }

  function openSendTestDialog() {
    if (!tests || tests.length === 0) {
      toast.error({
        title: "Aucun test disponible",
        description:
          "Tu dois d’abord créer au moins un test dans la brique Tests.",
      });
      return;
    }

    if (!currentCandidate.email) {
      toast.error({
        title: "Email manquant",
        description:
          "Le candidat doit avoir un email pour recevoir un lien de test.",
      });
      return;
    }

    if (!effectiveTestId && tests.length > 0) {
      setSelectedTestId(tests[0].id);
    }

    setIsSendTestOpen(true);
  }

  function handleSendTest() {
    if (!effectiveTestId) {
      toast.error({
        title: "Test manquant",
        description: "Sélectionne un test à envoyer.",
      });
      return;
    }

    if (!currentCandidate.email) {
      toast.error({
        title: "Email manquant",
        description:
          "Le candidat n’a pas d’email, impossible d’envoyer un test pour l’instant.",
      });
      return;
    }

    const expiresValue = Number(expiresInDays || "3");
    if (!Number.isFinite(expiresValue) || expiresValue <= 0) {
      toast.error({
        title: "Durée invalide",
        description: "La durée de validité doit être un nombre de jours > 0.",
      });
      return;
    }

    startSendTestTransition(async () => {
      const formData = new FormData();
      formData.set("candidateId", currentCandidate.id);
      formData.set("testId", effectiveTestId);
      formData.set("expiresInDays", String(expiresValue));

      const result = await sendCandidateTestInviteAction(formData);

      if (!result.ok) {
        console.error("[handleSendTest] error", result.error);
        toast.error({
          title: "Erreur",
          description: result.error,
        });
        return;
      }

      
      const sentTest = tests.find((t) => t.id === effectiveTestId) ?? null;
      setLastInviteUrl(result.url ?? null);
      setLastInviteTestName(sentTest?.name ?? null);

      toast.success({
        title: "Lien généré",
        description:
          "Le lien de test a été créé. Tu peux le copier et l’envoyer au candidat.",
      });
      // On laisse la modale ouverte pour copier le lien
    });
  }

  const left = (
    <>
      <CandidateInfoSection
        candidate={candidate}
        offer={
          currentCandidate.offerId
            ? (allOffers?.find((o) => o.id === currentCandidate.offerId) ??
              null)
            : null
        }
      />
      <CandidateSkillsSection candidate={candidate} />
      <CandidateNotesSection candidate={candidate} />

      {/* Résultats tests (placeholder pour l’instant) */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Tests envoyés
        </h2>

        {testInvites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun test envoyé pour le moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {testInvites.map(({ invite, testName }) => {
               const href = invite.submissionId
               ? `/candidates/${candidate.id}/tests/${invite.submissionId}`
               : null;
           
              const isExpired =
                invite.status === "pending" &&
                new Date(invite.expiresAt) < new Date();

              return (
                <li
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{testName}</span>
                    <span className="text-xs text-muted-foreground">
                      Envoyé le{" "}
                      {new Date(invite.createdAt).toLocaleDateString("fr-FR")} —{" "}
                      expire le{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        invite.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : isExpired
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {invite.status === "completed"
                        ? "Terminé"
                        : isExpired
                          ? "Expiré"
                          : "En attente"}
                    </span>
                    {href ? (
                      <a
                        href={href}
                        className="text-xs font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
                      >
                        Voir le résultat
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Résultat indisponible
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Résultat dernier test (démo) */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Résultat du dernier test
        </h2>

        {!latestCompletedSubmission ? (
          <p className="text-sm text-muted-foreground">
            Aucun test complété pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  Submission complétée le{" "}
                  {latestCompletedSubmission.completedAt
                    ? new Date(
                        latestCompletedSubmission.completedAt
                      ).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {latestCompletedSubmission.testId
                    ? `TestId: ${latestCompletedSubmission.testId}`
                    : "Test inconnu"}
                </p>
              </div>

              {latestScoreVM?.isScored ? (
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    latestScoreVM.badge === "Excellent"
                      ? "bg-emerald-50 text-emerald-700"
                      : latestScoreVM.badge === "Bon"
                        ? "bg-blue-50 text-blue-700"
                        : latestScoreVM.badge === "Moyen"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700",
                  ].join(" ")}
                >
                  {latestScoreVM.badge}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Non scoré
                </span>
              )}
            </div>

            {/* Score */}
            <div className="rounded-lg border bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">Score</p>
                <p className="text-sm font-semibold text-slate-900">
                  {latestScoreVM?.scoreLabel ?? "—"}
                </p>
              </div>

              {latestScoreVM?.isScored &&
              typeof latestScoreVM.ratio === "number" ? (
                <div className="mt-2">
                  <div className="relative">
                    {/* label positionné */}
                    <div
                      className="absolute top-6 -translate-x-1/2 text-[11px] font-medium text-slate-700"
                      style={{ left: `${markerLeft}%` }}
                    >
                      {pct}%
                    </div>

                    {/* barre */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* repères */}
                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  Mise en situation : À évaluer manuellement.
                </p>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Total submissions : {testSubmissions.length}
            </p>
          </div>
        )}
      </section>
    </>
  );

  const right = (
    <>
      <CandidateContextSection
        candidate={currentCandidate}
        offer={
          currentCandidate.offerId
            ? (allOffers?.find((o) => o.id === currentCandidate.offerId) ??
              null)
            : null
        }
      />

      {/* Actions rapides */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Actions rapides
        </h3>

        <CandidateCvSection
          candidate={currentCandidate}
          onUploadCv={handleUploadCv}
          disabled={isPending}
        />

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Associer une offre
          </label>

          {isPending ? (
            <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
          ) : (
            <>
              <Select
                key={`offer-${currentCandidate.id}`}
                value={offerSelectValue}
                onValueChange={(v) => {
                  const offerId = v === "none" ? null : v;
                  handleAssociateOffer(offerId);
                }}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {allOffers &&
                    allOffers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="offerId" value={offerSelectValue} />
            </>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full justify-center text-sm"
          >
            <a
              href={`/api/candidates/${candidate.id}/cv`}
              target="_blank"
              rel="noreferrer"
            >
              Afficher le CV
            </a>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-center text-sm text-rose-600 hover:text-rose-700"
          >
            Archiver le candidat
          </Button>
        </div>
      </section>

      {/* Historique placeholder */}
      <section className="rounded-xl border bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Historique
        </h3>
        <p className="text-sm text-muted-foreground">
          L&apos;historique des actions (tests envoyés, changements de statut…)
          sera affiché ici plus tard.
        </p>
      </section>
    </>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-xl border bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <CandidateAvatar
              name={candidate.fullName}
              size="lg"
              className="mt-0.5"
            />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold leading-tight">
                  {candidate.fullName}
                </h1>
                {candidate.status && (
                  <CandidateStatusBadge status={candidate.status} />
                )}
              </div>

              {candidate.email && (
                <p className="text-sm text-muted-foreground">
                  {candidate.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
            <Button
              className="text-sm"
              onClick={openSendTestDialog}
              disabled={isSendingTest}
            >
              {isSendingTest ? "Envoi en cours..." : "Envoyer un test"}
            </Button>
          </div>
        </header>

        <DetailTwoColumnLayout leftColumn={left} rightColumn={right} />
      </div>

      {/* Modal d'envoi de test */}
      <AppModal
        open={isSendTestOpen}
        onClose={() => {
          setIsSendTestOpen(false);
          setLastInviteUrl(null);
          setLastInviteTestName(null);
        }}
        title="Envoyer un test au candidat"
        width="md"
        isBusy={isSendingTest}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsSendTestOpen(false)}
              disabled={isSendingTest}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
            >
              {isSendingTest ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Choisis un test et une durée de validité. Un lien unique sera généré
            pour ce candidat.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Test à envoyer</Label>
            <Select
              value={effectiveTestId}
              onValueChange={(value) => setSelectedTestId(value)}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Sélectionne un test" />
              </SelectTrigger>
              <SelectContent>
                {tests.map((t) => {
                  const flowInfo = testFlowInfoMap[t.id];
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {flowInfo && ` (Parcours: ${flowInfo.flowName})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {effectiveTestId && testFlowInfoMap[effectiveTestId] && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <p className="font-medium">
                  📋 Parcours : {testFlowInfoMap[effectiveTestId].flowName}
                </p>
                <p className="text-blue-700 mt-0.5">
                  Étape {testFlowInfoMap[effectiveTestId].itemIndex} sur{" "}
                  {testFlowInfoMap[effectiveTestId].totalItems}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Validité du lien (jours)</Label>
            <Input
              type="number"
              min={1}
              className="h-9 text-sm"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>

          {lastInviteUrl && (
            <div className="space-y-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-medium text-slate-700">
                Lien généré pour{" "}
                <span className="font-semibold">
                  {lastInviteTestName ?? "ce test"}
                </span>
                :
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={lastInviteUrl}
                  className="h-9 text-xs"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(lastInviteUrl)
                      .then(() =>
                        toast.success({
                          title: "Copié",
                          description:
                            "Le lien a été copié dans le presse-papiers.",
                        })
                      )
                      .catch(() =>
                        toast.error({
                          title: "Erreur",
                          description:
                            "Impossible de copier le lien. Copie-le manuellement.",
                        })
                      );
                  }}
                >
                  Copier
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Tu peux coller ce lien dans un email manuel au candidat. Plus
                tard, on l&apos;enverra automatiquement via Postmark.
              </p>
            </div>
          )}
        </div>
      </AppModal>
    </>
  );
}
