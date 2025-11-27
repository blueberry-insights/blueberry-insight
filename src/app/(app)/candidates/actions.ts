
"use server";

import { ZodError } from "zod";
import type { CandidateListItem } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeCreateCandidate } from "@/core/usecases/candidates/createCandidate";
import { makeUpdateCandidateNote } from "@/core/usecases/candidates/updateCandidateNote";

type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };

export async function createCandidateAction(formData: FormData): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const tagsArray = tagsRaw.length > 0
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
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