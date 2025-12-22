"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeCreateQuestion } from "@/core/usecases/tests/createQuestion";
import { makeUpdateQuestion } from "@/core/usecases/tests/updateQuestion";
import { makeReorderQuestions } from "@/core/usecases/tests/reorderQuestions";

type Err = { ok: false; error: string };
type Ok<T> = { ok: true; data: T };

export async function createQuestionAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      const label = String(formData.get("label") ?? "").trim();
      const kind = String(formData.get("kind") ?? "").trim();

      if (!testId || !label || !kind) {
        return { ok: false, error: "testId, libellé et type sont obligatoires" };
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
      };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeUpdateQuestion(repo);
      await usecase(raw);

      revalidatePath(`/tests/${testId}`);
      return { ok: true, data: null };
    } catch (e) {
      console.error("[updateQuestionAction]", e);
      return {
        ok: false,
        error: "Erreur lors de la mise à jour de la question",
      };
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

      const entries: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        entries[key] = value;
      });
      console.log("[deleteQuestionAction] raw formData", entries, {
        testId,
        questionId,
      });

      if (!testId || !questionId) {
        return { ok: false, error: "testId et questionId sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      await repo.deleteQuestion( questionId, ctx.orgId);
      console.log("[deleteQuestionAction] question deleted");
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
      const orderRaw = String(formData.get("order") ?? "").trim(); // JSON string

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