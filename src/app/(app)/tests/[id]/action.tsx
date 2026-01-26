"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import {
  makeReorderQuestions,
  makeCreateQuestion,
  makeUpdateQuestion,
} from "@/core/usecases/tests";
import {
  getStringTrimmed,
  getStringOrUndefined,
  getNumberOrNull,
  getBoolean,
} from "@/shared/utils/formData";
import { logActionError } from "@/shared/utils/logger";

type Err = { ok: false; error: string };
type Ok<T> = { ok: true; data: T };

// IMPORTANT:
// Les questions/dimensions appartiennent au test => donc à l'orga du test.
// Dans ton modèle "catalogue Blueberry", ça doit rester ctx.orgId (Blueberry).
// Le ciblage vers d'autres orgas passe par test_catalog_targets, PAS par org_id des questions.

export async function createQuestionAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    try {
      const label = getStringTrimmed(formData, "label");
      const kind = getStringTrimmed(formData, "kind");
      const dimensionCode = getStringTrimmed(formData, "dimensionCode");
      const dimensionOrder = getNumberOrNull(formData, "dimensionOrder") ?? undefined;
      const context = getStringOrUndefined(formData, "context");
      
      // isReversed: accepte "true", "1", ou true
      const isReversedRaw = formData.get("isReversed");
      const isReversed =
        isReversedRaw == null
          ? undefined
          : String(isReversedRaw) === "true" || String(isReversedRaw) === "1";

      if (!testId || !label || !kind || !dimensionCode) {
        return {
          ok: false,
          error: "testId, libellé, type et dimensionCode sont obligatoires",
        };
      }
  
      // Options: split par \n, trim, filter
      const optionsRaw = getStringTrimmed(formData, "options");
      const options = optionsRaw
        ? optionsRaw.split("\n").map((s) => s.trim()).filter(Boolean)
        : undefined;

      const raw = {
        orgId: ctx.orgId,
        testId,
        label,
        kind,
        minValue: getNumberOrNull(formData, "minValue") ?? undefined,
        maxValue: getNumberOrNull(formData, "maxValue") ?? undefined,
        options,
        isRequired: getBoolean(formData, "isRequired") || true, // default true
        dimensionCode: dimensionCode || undefined,
        dimensionOrder: dimensionOrder || undefined,
        isReversed,
        context: context || undefined,
      };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeCreateQuestion(repo);
      const created = await usecase(raw);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: created };
    } catch (e) {
      logActionError("createQuestionAction", e, { testId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors de la création de la question" };
    }
  });
}

export async function updateQuestionAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    const questionId = getStringTrimmed(formData, "questionId");
    try {
      const label = getStringTrimmed(formData, "label");
      const kind = getStringTrimmed(formData, "kind");
      const context = getStringOrUndefined(formData, "context");

      // isReversed: accepte "true", "1", ou true
      const isReversedRaw = formData.get("isReversed");
      const isReversed =
        isReversedRaw == null
          ? undefined
          : String(isReversedRaw) === "true" || String(isReversedRaw) === "1";

      if (!testId || !questionId || !label || !kind) {
        return {
          ok: false,
          error: "testId, questionId, libellé et type sont obligatoires",
        };
      }

      // Options: split par \n, trim, filter
      const optionsRaw = getStringTrimmed(formData, "options");
      const options = optionsRaw
        ? optionsRaw.split("\n").map((s) => s.trim()).filter(Boolean)
        : undefined;

      const raw = {
        orgId: ctx.orgId,
        questionId,
        label,
        kind,
        context: context || undefined,
        dimensionCode: getStringTrimmed(formData, "dimensionCode") || undefined,
        dimensionOrder: getNumberOrNull(formData, "dimensionOrder") ?? undefined,
        minValue: getNumberOrNull(formData, "minValue") ?? undefined,
        maxValue: getNumberOrNull(formData, "maxValue") ?? undefined,
        options,
        isRequired: getBoolean(formData, "isRequired") || true, // default true
        isReversed,
      };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeUpdateQuestion(repo);
      await usecase(raw);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      logActionError("updateQuestionAction", e, { testId, questionId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors de la mise à jour de la question" };
    }
  });
}


export async function deleteQuestionAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    const questionId = getStringTrimmed(formData, "questionId");
    try {

      if (!testId || !questionId) {
        return { ok: false, error: "testId et questionId sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      await repo.deleteQuestion(questionId, ctx.orgId);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      logActionError("deleteQuestionAction", e, { testId, questionId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors de la suppression de la question" };
    }
  });
}

export async function reorderQuestionsAction(formData: FormData) {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    const orderRaw = getStringTrimmed(formData, "order");
    try {
      if (!testId || !orderRaw) return { ok: false, error: "Champs manquants" };

      const order = JSON.parse(orderRaw) as { questionId: string; orderIndex: number }[];

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeReorderQuestions(repo);

      await usecase({ orgId: ctx.orgId, testId, order });

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      logActionError("reorderQuestionsAction", e, { testId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors du reorder" };
    }
  });
}

// Dimensions: pareil, c'est dans l'orga du test (Blueberry), pas "target org"
export async function createDimensionAction(formData: FormData) {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    const title = getStringTrimmed(formData, "title");
    try {
      if (!testId || !title) {
        return { ok: false, error: "testId et title sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      const existing = await repo.listDimensionsByTest?.(testId, ctx.orgId);

      const nextIndex = (existing?.at(-1)?.orderIndex ?? 0) + 1;
      const nextCode = `D${nextIndex}`;

      const created = await repo.createDimension({
        orgId: ctx.orgId,
        testId,
        code: nextCode,
        title,
        orderIndex: nextIndex,
      });

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: created };
    } catch (e) {
      logActionError("createDimensionAction", e, { testId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors de la création de la thématique" };
    }
  });
}

export async function updateDimensionTitleAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    const testId = getStringTrimmed(formData, "testId");
    const dimensionId = getStringTrimmed(formData, "dimensionId");
    const title = getStringTrimmed(formData, "title");
    try {

      if (!testId || !dimensionId || !title) {
        return { ok: false, error: "testId, dimensionId et title sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      await repo.updateDimensionTitle({ orgId: ctx.orgId, dimensionId, title });

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      logActionError("updateDimensionTitleAction", e, { testId, dimensionId, orgId: ctx.orgId });
      return { ok: false, error: "Erreur lors du renommage de la dimension" };
    }
  });
}
