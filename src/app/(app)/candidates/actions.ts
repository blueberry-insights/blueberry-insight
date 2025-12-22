"use server";

import { ZodError } from "zod";
import type { CandidateListItem, CandidateStatus } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeCreateCandidate } from "@/core/usecases/candidates/createCandidate";
import { makeUpdateCandidateNote } from "@/core/usecases/candidates/updateCandidateNote";
import { makeDeleteCandidate } from "@/core/usecases/candidates/deleteCandidate";
import { makeUpdateCandidate } from "@/core/usecases/candidates/updateCandidate";

type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };

type DeleteOk = { ok: true };
type DeleteErr = { ok: false; error: string };

export type DeleteCandidateResult = DeleteOk | DeleteErr;

export async function createCandidateAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const tagsArray =
      tagsRaw.length > 0
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const raw = {
      orgId: ctx.orgId,
      fullName: formData.get("fullName"),
      email: formData.get("email") || null,
      status: formData.get("status") || undefined,
      source: formData.get("source") || null,
      tags: tagsArray,
      note: formData.get("note") || null,
      offerId: formData.get("offerId") || null,
    };

    const repo = makeCandidateRepo(ctx.sb);
    const createCandidate = makeCreateCandidate(repo);

    try {
      const candidate = await createCandidate(raw);
      return { ok: true, candidate };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[createCandidateAction] error:", err);
      return { ok: false, error: "Erreur lors de la création du candidat" };
    }
  });
}
export async function updateCandidateAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const tagsArray =
      tagsRaw.length > 0
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
        
    const raw = {
      orgId: ctx.orgId,
      candidateId: String(formData.get("id") ?? ""),
      note: String(formData.get("note") ?? "").trim() || null,
      fullName: String(formData.get("fullName") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      status: String(formData.get("status") ?? "").trim() || null,
      source: String(formData.get("source") ?? "").trim() || null,
      tags: tagsArray,
      offerId: String(formData.get("offerId") ?? "").trim() || null,
    };

    const repo = makeCandidateRepo(ctx.sb);
    const updateCandidate = makeUpdateCandidate(repo);

    try {
      const candidate = await updateCandidate(raw);
      return { ok: true, candidate };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[updateCandidateAction] error:", err);
      return { ok: false, error: "Erreur lors de la mise à jour du candidat" };
    }
  });
}

export async function updateCandidateNoteAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const raw = {
      orgId: ctx.orgId,
      candidateId: String(formData.get("id") ?? ""),
      note: String(formData.get("note") ?? "").trim() || null,
    };

    const repo = makeCandidateRepo(ctx.sb);
    const updateNote = makeUpdateCandidateNote(repo);

    try {
      const candidate = await updateNote(raw);
      return { ok: true, candidate };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[updateCandidateNoteAction] error:", err);
      return { ok: false, error: "Erreur lors de la mise à jour de la note" };
    }
  });
}

export async function updateCandidateStatusAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const candidateId = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "").trim() || null;

    const repo = makeCandidateRepo(ctx.sb);
    const currentCandidate = await repo.getById(ctx.orgId, candidateId);

    if (!currentCandidate) {
      return { ok: false, error: "Candidat introuvable" };
    }

    const updateCandidate = makeUpdateCandidate(repo);

    try {
      const candidate = await updateCandidate({
        orgId: ctx.orgId,
        candidateId,
        fullName: currentCandidate.fullName,
        email: currentCandidate.email ?? null,
        status: (status as CandidateStatus) || undefined,
        source: currentCandidate.source ?? null,
        tags: currentCandidate.tags ?? [],
        note: currentCandidate.note ?? null,
        offerId: currentCandidate.offerId ?? null,
      });
      return { ok: true, candidate };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[updateCandidateStatusAction] error:", err);
      return { ok: false, error: "Erreur lors de la mise à jour du statut" };
    }
  });
}

export async function deleteCandidateAction(
  formData: FormData
): Promise<DeleteCandidateResult> {
  return withAuth(async (ctx) => {
    const candidateId = String(formData.get("candidateId") ?? "").trim();
    const cvPathRaw = formData.get("cvPath");
    const cvPath =
      typeof cvPathRaw === "string" ? cvPathRaw.trim() : (cvPathRaw as string | null);

    if (!candidateId) {
      return { ok: false, error: "Candidat introuvable" };
    }

    const orgId = ctx.orgId;
    if (!orgId) {
      return {
        ok: false,
        error: "Organisation introuvable pour cet utilisateur",
      };
    }

    const sb = ctx.sb;

    if (cvPath && cvPath.length > 0) {
      const { error: storageError } = await sb.storage
        .from("candidate-cv")
        .remove([cvPath]);

      if (storageError) {
        console.error("[deleteCandidateAction] storage error", storageError);
        return {
          ok: false,
          error: "Erreur lors de la suppression du CV du candidat",
        };
      }
    }

    const repo = makeCandidateRepo(sb);
    const deleteCandidate = makeDeleteCandidate(repo);

    try {
      await deleteCandidate({
        orgId,
        candidateId,
      });

      return { ok: true };
    } catch (err) {
      console.error("[deleteCandidateAction] error:", err);
      return {
        ok: false,
        error: "Erreur lors de la suppression du candidat",
      };
    }
  });
}
