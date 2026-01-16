// app/(app)/tests/action.ts
"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/infra/supabase/session";
import { makeTestRepo } from "@/infra/supabase/adapters/test.repo.supabase";
import {
  makeArchiveTest,
  makeDeleteTest,
  makeUpdateTest,
  makeCreateTest,
  makeDuplicateTest,
} from "@/core/usecases/tests";
import { makeTestFlowRepo } from "@/infra/supabase/adapters/testFlow.repo.supabase";
import { env } from "@/config/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";
import type { ArchiveTestInput } from "@/core/usecases/tests/editor/archiveTest";

type ArchiveOk = { ok: true };
type ArchiveErr = { ok: false; error: string };
type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

const BLUEBERRY_ORG_ID = env.BLUEBERRY_ORG_ID;

type Ctx = {
  sb: SupabaseClient<Database>;
  orgId: string;
  userId: string;
  role: string;
};

function normalizeTargetOrgIds(formData: FormData): string[] {
  return Array.from(
    new Set(
      formData
        .getAll("targetOrgIds")
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function canManageCatalog(ctx: Pick<Ctx, "orgId" | "role">): boolean {
  return (
    ctx.orgId === BLUEBERRY_ORG_ID &&
    ["owner", "admin", "blueberry_admin"].includes(ctx.role)
  );
}

/**
 * Vérité terrain : est-ce que ce test appartient à l'orga Blueberry ?
 * (Si RLS empêche de le voir -> on le traite comme "non")
 */
async function isBlueberryCatalogTest(sb: SupabaseClient<Database>, testId: string): Promise<boolean> {
  const { data, error } = await sb
    .from("tests")
    .select("org_id")
    .eq("id", testId)
    .maybeSingle();

  // Si erreur (RLS ou autre), on préfère ne pas faire de targeting
  if (error) return false;
  if (!data) return false;

  return data.org_id === BLUEBERRY_ORG_ID;
}

async function replaceTargetsForTest(
  sb: SupabaseClient<Database>,
  testId: string,
  targetOrgIds: string[]
) {
  const uniq = Array.from(new Set(targetOrgIds)).filter(Boolean);

  // delete all
  const { error: delErr } = await sb
    .from("test_catalog_targets")
    .delete()
    .eq("test_id", testId);

  if (delErr) throw delErr;

  if (uniq.length === 0) return;

  const rows = uniq.map((orgId) => ({ test_id: testId, org_id: orgId }));
  const { error: insErr } = await sb.from("test_catalog_targets").insert(rows);
  if (insErr) throw insErr;
}

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

export async function createTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const name = String(formData.get("name") ?? "").trim();
      const type = String(formData.get("type") ?? "").trim();
      const description =
        String(formData.get("description") ?? "").trim() || null;

      const exposure = String(formData.get("exposure") ?? "global").trim();
      const targetOrgIds = normalizeTargetOrgIds(formData);

      if (!name || !type) return { ok: false, error: "Nom et type obligatoires" };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeCreateTest(repo);

      // 1) Create test (dans l'orga active)
      const created = await usecase({
        orgId: ctx.orgId,
        createdBy: ctx.userId,
        name,
        type: type as "motivations" | "scenario",
        description,
      });

      // 2) Targeting UNIQUEMENT si on est en orga Blueberry + rôle autorisé
      if (canManageCatalog(ctx)) {
        const finalTargets = exposure === "targeted" ? targetOrgIds : [];
        await replaceTargetsForTest(ctx.sb, created.id, finalTargets);
      }

      revalidatePath("/tests");
      return { ok: true, data: created };
    } catch (e) {
      console.error("[createTestAction]", e);
      return { ok: false, error: e instanceof Error ? e.message : "Erreur création test" };
    }
  });
}

export async function updateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = String(formData.get("id") ?? "").trim();
      const name = String(formData.get("name") ?? "").trim();
      const description =
        String(formData.get("description") ?? "").trim() || null;

      const exposure = String(formData.get("exposure") ?? "global").trim();
      const targetOrgIds = normalizeTargetOrgIds(formData);

      if (!testId || !name) {
        return { ok: false, error: "testId et nom sont obligatoires" };
      }

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeUpdateTest(repo);

      // 1) Update test (RLS scoping)
      const updated = await usecase({
        id: testId,
        orgId: ctx.orgId,
        name,
        description,
      });

      // 2) Targeting seulement si :
      // - user peut gérer catalogue
      // - ET le test est bien un test Blueberry (vérité DB)
      if (canManageCatalog(ctx)) {
        const catalog = await isBlueberryCatalogTest(ctx.sb, testId);
        if (catalog) {
          const finalTargets = exposure === "targeted" ? targetOrgIds : [];
          await replaceTargetsForTest(ctx.sb, testId, finalTargets);
        }
      }

      revalidatePath("/tests");
      return { ok: true, data: updated };
    } catch (e) {
      console.error("[updateTestAction]", e);
      return { ok: false, error: e instanceof Error ? e.message : "Erreur update test" };
    }
  });
}

export async function duplicateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      if (!testId) return { ok: false, error: "testId obligatoire" };

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
      return { ok: false, error: e instanceof Error ? e.message : "Erreur duplication" };
    }
  });
}

export async function deleteTestAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      if (!testId) return { ok: false, error: "testId obligatoire" };

      const testRepo = makeTestRepo(ctx.sb);
      const testFlowRepo = makeTestFlowRepo(ctx.sb);

      const usecase = makeDeleteTest(testRepo, testFlowRepo);
      const result = await usecase({
        orgId: ctx.orgId,
        testId,
        role: ctx.role,
      });

      if (!result.ok) return { ok: false, error: result.message };

      revalidatePath("/tests");
      return { ok: true, data: null };
    } catch (e) {
      console.error("[deleteTestAction]", e);
      return { ok: false, error: e instanceof Error ? e.message : "Erreur suppression test" };
    }
  });
}

export async function getTestTargetsAction(
  formData: FormData
): Promise<Ok<string[]> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      if (!testId) return { ok: false, error: "testId obligatoire" };

      // Pas blueberry_admin => on ne leak rien
      if (!canManageCatalog(ctx)) return { ok: true, data: [] };

      // Si pas un test Blueberry => []
      const catalog = await isBlueberryCatalogTest(ctx.sb, testId);
      if (!catalog) return { ok: true, data: [] };

      const { data, error } = await ctx.sb
        .from("test_catalog_targets")
        .select("org_id")
        .eq("test_id", testId);

      if (error) throw error;

      return { ok: true, data: (data ?? []).map((r: { org_id: string }) => r.org_id) };
    } catch (e) {
      console.error("[getTestTargetsAction]", e);
      return { ok: false, error: e instanceof Error ? e.message : "Erreur get targets" };
    }
  });
}

export async function archiveTestAction(
  formData: FormData
): Promise<ArchiveOk | ArchiveErr> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = String(formData.get("testId") ?? "").trim();
      if (!ctx.orgId) return { ok: false, error: "Organisation introuvable" };
      if (!testId) return { ok: false, error: "Test introuvable" };

      const repo = makeTestRepo(ctx.sb);
      const archiveTest = makeArchiveTest(repo);

      await archiveTest({ orgId: ctx.orgId, testId } as ArchiveTestInput);

      revalidatePath("/tests");
      return { ok: true };
    } catch (err) {
      console.error("[archiveTestAction] error:", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Erreur archivage",
      };
    }
  });
}
