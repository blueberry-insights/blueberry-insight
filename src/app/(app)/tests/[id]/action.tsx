"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import {
  makeReorderQuestions,
  makeCreateQuestion,
  makeUpdateQuestion,
} from "@/core/usecases/tests";

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
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const label = String(formData.get("label") ?? "").trim();
      const kind = String(formData.get("kind") ?? "").trim();
      const dimensionCode = String(formData.get("dimensionCode") ?? "").trim();
      const dimensionOrder = formData.get("dimensionOrder")
        ? Number(formData.get("dimensionOrder"))
        : undefined;

      const context = String(formData.get("context") ?? "").trim() || undefined;
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
  
      const raw = {
        orgId: ctx.orgId,
        testId,
        label,
        kind,
        minValue: formData.get("minValue")
          ? Number(formData.get("minValue"))
          : undefined,
        maxValue: formData.get("maxValue")
          ? Number(formData.get("maxValue"))
          : undefined,
        options: (() => {
          const rawOptions = String(formData.get("options") ?? "").trim();
          if (!rawOptions) return undefined;
          return rawOptions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        })(),
        isRequired: String(formData.get("isRequired") ?? "true") === "true",
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
      console.error("[createQuestionAction]", e);
      return { ok: false, error: "Erreur lors de la création de la question" };
    }
  });
}

export async function updateQuestionAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const questionId = String(formData.get("questionId") ?? "").trim();
      const label = String(formData.get("label") ?? "").trim();
      const kind = String(formData.get("kind") ?? "").trim();

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

      const raw = {
        orgId: ctx.orgId,
        questionId,
        label,
        kind,
        dimensionCode:
          String(formData.get("dimensionCode") ?? "").trim() || undefined,
        dimensionOrder: formData.get("dimensionOrder")
          ? Number(formData.get("dimensionOrder"))
          : undefined,
        minValue: formData.get("minValue")
          ? Number(formData.get("minValue"))
          : undefined,
        maxValue: formData.get("maxValue")
          ? Number(formData.get("maxValue"))
          : undefined,
        options: (() => {
          const rawOptions = String(formData.get("options") ?? "").trim();
          if (!rawOptions) return undefined;
          return rawOptions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        })(),
        isRequired: String(formData.get("isRequired") ?? "true") === "true",
        isReversed,
      };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeUpdateQuestion(repo);
      await usecase(raw);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[updateQuestionAction]", e);
      return { ok: false, error: "Erreur lors de la mise à jour de la question" };
    }
  });
}

export async function deleteQuestionAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const questionId = String(formData.get("questionId") ?? "").trim();

      if (!testId || !questionId) {
        return { ok: false, error: "testId et questionId sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      await repo.deleteQuestion(questionId, ctx.orgId);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[deleteQuestionAction]", e);
      return { ok: false, error: "Erreur lors de la suppression de la question" };
    }
  });
}

export async function reorderQuestionsAction(formData: FormData) {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const orderRaw = String(formData.get("order") ?? "").trim();
      if (!testId || !orderRaw) return { ok: false, error: "Champs manquants" };

      const order = JSON.parse(orderRaw) as { questionId: string; orderIndex: number }[];

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeReorderQuestions(repo);

      await usecase({ orgId: ctx.orgId, testId, order });

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[reorderQuestionsAction]", e);
      return { ok: false, error: "Erreur lors du reorder" };
    }
  });
}

// Dimensions: pareil, c'est dans l'orga du test (Blueberry), pas "target org"
export async function createDimensionAction(formData: FormData) {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const title = String(formData.get("title") ?? "").trim();
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
      console.error("[createDimensionAction]", e);
      return { ok: false, error: "Erreur lors de la création de la thématique" };
    }
  });
}

export async function updateDimensionTitleAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const dimensionId = String(formData.get("dimensionId") ?? "").trim();
      const title = String(formData.get("title") ?? "").trim();

      if (!testId || !dimensionId || !title) {
        return { ok: false, error: "testId, dimensionId et title sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      await repo.updateDimensionTitle({ orgId: ctx.orgId, dimensionId, title });

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[updateDimensionTitleAction]", e);
      return { ok: false, error: "Erreur lors du renommage de la dimension" };
    }
  });
}
