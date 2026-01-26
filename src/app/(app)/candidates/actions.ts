"use server";

import type { CandidateListItem, CandidateStatus } from "@/core/models/Candidate";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeCreateCandidate, type CandidateInput } from "@/core/usecases/candidates/createCandidate";
import { makeUpdateCandidateNote, type UpdateCandidateNoteInput } from "@/core/usecases/candidates/updateCandidateNote";
import { makeDeleteCandidate, type DeleteCandidateInput } from "@/core/usecases/candidates/deleteCandidate";
import { makeUpdateCandidate, type UpdateInput } from "@/core/usecases/candidates/updateCandidate";
import { makeArchiveCandidate, type ArchiveCandidateInput } from "@/core/usecases/candidates/archiveCandidate";
import { createActionHandler } from "@/shared/utils/actionHandler";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";
import {
  getString,
  getStringTrimmed,
  getStringOrNull,
  getStringArray,
  getTypedOrUndefined,
} from "@/shared/utils/formData";

type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };
type DeleteOk = { ok: true };
type DeleteErr = { ok: false; error: string };


export type DeleteCandidateResult = DeleteOk | DeleteErr;

export const createCandidateAction = createActionHandler<
  CandidateInput,
  CandidateListItem,
  CandidateRepo
>({
  actionName: "createCandidateAction",
  errorMessage: "Erreur lors de la création du candidat",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    location: getStringOrNull(formData, "location"),
    phone: getStringOrNull(formData, "phone"),
    status: getTypedOrUndefined<CandidateStatus>(formData, "status"),
    source: getStringOrNull(formData, "source"),
    tags: getStringArray(formData, "tags"),
    note: getStringOrNull(formData, "note"),
    offerId: getStringOrNull(formData, "offerId"),
  }),
  
  makeRepo: (sb) => makeCandidateRepo(sb),
  makeUsecase: (repo) => makeCreateCandidate(repo),
  transformResult: (candidate) => ({
    ok: true as const,
    candidate,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;
export const updateCandidateAction = createActionHandler<
  UpdateInput,
  CandidateListItem,
  CandidateRepo
>({
  actionName: "updateCandidateAction",
  errorMessage: "Erreur lors de la mise à jour du candidat",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    candidateId: getStringTrimmed(formData, "id"),
    note: getStringOrNull(formData, "note"),
    fullName: getStringTrimmed(formData, "fullName"),
    email: getStringTrimmed(formData, "email"),
    phone: getStringOrNull(formData, "phone"),
    location: getStringOrNull(formData, "location"),
    status: getTypedOrUndefined<CandidateStatus>(formData, "status"),
    source: getStringOrNull(formData, "source"),
    tags: getStringArray(formData, "tags"),
    offerId: getStringOrNull(formData, "offerId"),
  }),
  makeRepo: (sb) => makeCandidateRepo(sb),
  makeUsecase: (repo) => makeUpdateCandidate(repo),
  transformResult: (candidate) => ({
    ok: true as const,
    candidate,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;

export const updateCandidateNoteAction = createActionHandler<
  UpdateCandidateNoteInput,
  CandidateListItem,
  CandidateRepo
>({
  actionName: "updateCandidateNoteAction",
  errorMessage: "Erreur lors de la mise à jour de la note",
  
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    candidateId: getStringTrimmed(formData, "id"),
    note: getStringOrNull(formData, "note"),
  }),
  makeRepo: (sb) => makeCandidateRepo(sb),
  makeUsecase: (repo) => makeUpdateCandidateNote(repo),
  transformResult: (candidate) => ({
    ok: true as const,
    candidate,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;

export const updateCandidateStatusAction = createActionHandler<
  { orgId: string; candidateId: string; status: string | null },
  CandidateListItem,
  CandidateRepo
>({
  actionName: "updateCandidateStatusAction",
  errorMessage: "Erreur lors de la mise à jour du statut",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    candidateId: getStringTrimmed(formData, "id"),
    status: getStringOrNull(formData, "status"),
  }),
  makeRepo: (sb) => makeCandidateRepo(sb),
  makeUsecase: (repo) => {
    const updateCandidate = makeUpdateCandidate(repo);
    return async (input: { orgId: string; candidateId: string; status: string | null }) => {
      const currentCandidate = await repo.getById(input.orgId, input.candidateId);
      if (!currentCandidate) {
        throw new Error("Candidat introuvable");
      }
      return updateCandidate({
        orgId: input.orgId,
        candidateId: input.candidateId,
        fullName: currentCandidate.fullName,
        email: currentCandidate.email ?? "",
        status: (input.status as CandidateStatus) || undefined,
        source: currentCandidate.source ?? null,
        tags: currentCandidate.tags ?? [],
        note: currentCandidate.note ?? null,
        offerId: currentCandidate.offerId ?? null,
      });
    };
  },
  transformResult: (candidate) => ({
    ok: true as const,
    candidate,
  }),
}) as (formData: FormData) => Promise<Ok | Err>;

export const deleteCandidateAction = createActionHandler<
  DeleteCandidateInput & { cvPath: string | null },
  void,
  CandidateRepo,
  void
>({
  actionName: "deleteCandidateAction",
  errorMessage: "Erreur lors de la suppression du candidat",
  mapInput: (formData, ctx) => {
    const candidateId = getStringTrimmed(formData, "candidateId");
    const cvPathRaw = formData.get("cvPath");
    const cvPath =
      typeof cvPathRaw === "string" ? cvPathRaw.trim() : (cvPathRaw as string | null);
    return {
      orgId: ctx.orgId,
      candidateId,
      cvPath,
    };
  },
  makeRepo: (sb) => makeCandidateRepo(sb),
  makeUsecase: (repo) => makeDeleteCandidate(repo),
  beforeUsecase: async (ctx, input) => {
    if (!input.candidateId) {
      return { ok: false, error: "Candidat introuvable" };
    }
    if (!input.orgId) {
      return { ok: false, error: "Organisation introuvable pour cet utilisateur" };
    }
    if (input.cvPath && input.cvPath.length > 0) {
      const { error: storageError } = await ctx.sb.storage
        .from("candidate-cv")
        .remove([input.cvPath]);
      if (storageError) {
        console.error("[deleteCandidateAction] storage error", storageError);
        return {
          ok: false,
          error: "Erreur lors de la suppression du CV du candidat",
        };
      }
    } 
    return null;
  },
  transformResult: () => ({
    ok: true as const,
  }),
}) as (formData: FormData) => Promise<DeleteCandidateResult>;

/**
 * ✅ REFACTORÉ avec helper générique
 * - Types stricts : pas de `any`
 * - Code réduit : 20 lignes au lieu de 17 (mais plus maintenable)
 * - Règles métier préservées : validations préalables, format de retour avec candidateId
 */
export const archiveCandidateAction = createActionHandler<
  ArchiveCandidateInput,
  void,
  CandidateRepo,
  { candidateId: string }
>({
  actionName: "archiveCandidateAction",
  errorMessage: "Erreur lors de l'archivage du candidat",
  mapInput: (formData, ctx) => ({
    orgId: ctx.orgId,
    candidateId: getStringTrimmed(formData, "candidateId"),
  }),
  makeRepo: (sb) => makeCandidateRepo(sb),

  makeUsecase: (repo) => makeArchiveCandidate(repo),
  beforeUsecase: async (_ctx, input) => {
    if (!input.orgId) {
      return { ok: false, error: "Organisation introuvable pour cet utilisateur" };
    }
    if (!input.candidateId) {
      return { ok: false, error: "Candidat introuvable" };
    }
    return null;
  },
  afterUsecase: async (_ctx, input) => {
    return { candidateId: input.candidateId };
  },
  transformResult: (result) => ({
    ok: true as const,
    candidateId: result.candidateId,
  }),
}) as (formData: FormData) => Promise<{ ok: true; candidateId: string } | { ok: false; error: string }>;
