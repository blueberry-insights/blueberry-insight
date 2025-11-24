
"use server";

import { ZodError } from "zod";
import type { CandidateListItem } from "@/core/models/Candidate";
import { withAuth } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";
import { makeCreateCandidate } from "@/core/usecases/createCandidate";

type Ok = { ok: true; candidate: CandidateListItem };
type Err = { ok: false; error: string };


export async function createCandidateAction(formData: FormData): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const fullName = String(formData.get("fullName") ?? "");
    const emailRaw = String(formData.get("email") ?? "");
    const email = emailRaw ? emailRaw : null;
    const statusRaw = String(formData.get("status") ?? "").trim();
    const sourceRaw = String(formData.get("source") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const noteRaw = String(formData.get("note") ?? "").trim();

    const tags =
      tagsRaw.length > 0
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const repo = makeCandidateRepo(ctx.sb);
    const createCandidate = makeCreateCandidate(repo);

    try {
      const candidate = await createCandidate({
        orgId: ctx.orgId,
        fullName,
        email,
        status: statusRaw || undefined,
        source: sourceRaw || null,
        tags,
        note: noteRaw || null,
      });
      return { ok: true, candidate };
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues.at(0);
        return { ok: false, error: issue?.message ?? "Données invalides" };
      }

      console.error("[createCandidateAction] repo error:", err);
      return { ok: false, error: "Erreur lors de la création du candidat" };
    }
  });
}

export async function updateCandidateNoteAction(
  formData: FormData
): Promise<Ok | Err> {
  return withAuth(async (ctx) => {
    const candidateId = String(formData.get("id") ?? "");
    const noteRaw = String(formData.get("note") ?? "").trim();
    const note = noteRaw || null;

    const repo = makeCandidateRepo(ctx.sb);

    try {
      const candidate = await repo.updateNote({ orgId: ctx.orgId, candidateId, note });
      return { ok: true, candidate };
    } catch (err) {
      console.error("[updateCandidateNoteAction] repo error:", err);
      return { ok: false, error: "Erreur lors de la mise à jour de la note" };
    }
  });
}