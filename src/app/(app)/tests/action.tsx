// app/(app)/tests/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import { makeCreateTest } from "@/core/usecases/tests/createTest";
import { makeDuplicateTest } from "@/core/usecases/tests/duplicateTest";
import { makeUpdateTest } from "@/core/usecases/tests/updateTest";
import { makeDeleteTest } from "@/core/usecases/tests/deleteTest";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

export async function createTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx) => {
    try {
      const raw = {
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        name: String(formData.get("name") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
      };

      if (!raw.name || !raw.type) {
        return { ok: false, error: "Nom et type obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeCreateTest(repo);
      const created = await usecase(raw);

      revalidatePath("/tests");
      return { ok: true, data: created };
    } catch (e) {
      console.error("[createTestAction]", e);
      return {
        ok: false,
        error: "Erreur lors de la création du questionnaire",
      };
    }
  });
}

export async function updateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx) => {
    try {
      const raw = {
        orgId: ctx.orgId,
        testId: String(formData.get("testId") ?? "").trim(),
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        // isActive : tu peux le rajouter plus tard pour archiver via la même action
      };

      if (!raw.testId || !raw.name) {
        return { ok: false, error: "testId et nom sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeUpdateTest(repo);
      const updated = await usecase(raw);

      revalidatePath("/tests");
      return { ok: true, data: updated };
    } catch (e) {
      console.error("[updateTestAction]", e);
      return { ok: false, error: "Erreur lors de la mise à jour du questionnaire" };
    }
  });
}
export async function duplicateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      if (!testId) {
        return { ok: false, error: "testId obligatoire" };
      }

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeDuplicateTest(repo);

      const duplicated = await usecase({
        orgId: ctx.orgId,
        testId,
        createdBy: ctx.userId,
      });

      revalidatePath("/tests");
      return { ok: true, data: duplicated };
    } catch (e) {
      console.error("[duplicateTestAction]", e);
      return {
        ok: false,
        error: "Erreur lors de la duplication du questionnaire",
      };
    }
  });
}

export async function deleteTestAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();

      if (!testId) {
        return { ok: false, error: "testId obligatoire" };
      }

      const testRepo = makeTestRepo(ctx.sb);
      const testFlowRepo = makeTestFlowRepo(ctx.sb);

      
      const role = ctx.role;

      const usecase = makeDeleteTest(testRepo, testFlowRepo);
      const result = await usecase({ orgId: ctx.orgId, testId, role });

      if (!result.ok) {
        return { ok: false, error: result.message };
      }

      revalidatePath("/tests");
      return { ok: true, data: null };
    } catch (e) {
      console.error("[deleteTestAction] error", e);
      return {
        ok: false,
        error:
          e instanceof Error ? e.message : "Erreur lors de la suppression du test",
      };
    }
  });
}

