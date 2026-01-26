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
import { getStringArray, getStringOrNull, getStringTrimmed } from "@/shared/utils/formData";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

type ArchiveOk = { ok: true };
type ArchiveErr = { ok: false; error: string };

const BLUEBERRY_ORG_ID = env.BLUEBERRY_ORG_ID;

type Ctx = {
  sb: SupabaseClient<Database>;
  orgId: string;
  userId: string;
  role: string;
};

function uniqIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((s) => String(s).trim()).filter(Boolean)));
}

function normalizeTargetOrgIds(formData: FormData): string[] {
  return uniqIds(getStringArray(formData, "targetOrgIds"));
}

/**
 * Permission "catalog management":
 * uniquement quand tu es DANS l'orga Blueberry + rôle autorisé.
 */
function canManageCatalog(ctx: Pick<Ctx, "orgId" | "role">): boolean {
  return (
    ctx.orgId === BLUEBERRY_ORG_ID &&
    ["owner", "admin", "blueberry_admin"].includes(ctx.role)
  );
}

function getBlueberryOrgId(): string {
  if (!BLUEBERRY_ORG_ID) {
    throw new Error("BLUEBERRY_ORG_ID is not defined in env");
  }
  return BLUEBERRY_ORG_ID;
}

/**
 * Convention actuelle (important) :
 * - test_catalog_targets = []  => "global" (visible partout)
 * - test_catalog_targets = [orgIds...] => "targeted"
 *
 * Patch: quand exposure=targeted, Blueberry doit être inclus
 * pour que Blueberry voie toujours ses propres tests.
 */

function ensureBlueberryIncluded(targetOrgIds: string[]): string[] {
  const blueberryOrgId = getBlueberryOrgId();
  return uniqIds([blueberryOrgId, ...targetOrgIds]);
}

function computeCatalogTargets(input: {
  exposure: string; // "global" | "targeted"
  targetOrgIds: string[];
}): string[] {
  if (input.exposure === "targeted") {
    return ensureBlueberryIncluded(input.targetOrgIds);
  }
  return []; // global
}

/**
 * Vérité terrain : est-ce que ce test appartient à l'orga Blueberry ?
 * (Si RLS empêche de le voir -> on le traite comme "non")
 */
async function isBlueberryCatalogTest(
  sb: SupabaseClient<Database>,
  testId: string
): Promise<boolean> {
  const { data, error } = await sb
    .from("tests")
    .select("org_id")
    .eq("id", testId)
    .maybeSingle();

  if (error) return false;
  if (!data) return false;

  return data.org_id === BLUEBERRY_ORG_ID;
}

async function replaceTargetsForTest(
  sb: SupabaseClient<Database>,
  testId: string,
  targetOrgIds: string[]
) {
  const uniq = uniqIds(targetOrgIds);

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

async function getTargetsForTest(
  sb: SupabaseClient<Database>,
  testId: string
): Promise<string[]> {
  const { data, error } = await sb
    .from("test_catalog_targets")
    .select("org_id")
    .eq("test_id", testId);

  if (error) throw error;

  return (data ?? []).map((r: { org_id: string }) => r.org_id);
}

/**
 * Copie la logique d'exposition d'un test source -> test dupliqué
 * Règle: si source a 0 targets => global => [].
 * Sinon targeted => targets + Blueberry.
 */
async function copyCatalogTargetsIfNeeded(input: {
  sb: SupabaseClient<Database>;
  ctx: Ctx;
  sourceTestId: string;
  newTestId: string;
}) {
  const { sb, ctx, sourceTestId, newTestId } = input;

  if (!canManageCatalog(ctx)) return;

  const sourceIsCatalog = await isBlueberryCatalogTest(sb, sourceTestId);
  if (!sourceIsCatalog) return;

  const srcOrgIds = await getTargetsForTest(sb, sourceTestId);

  const finalTargets =
    srcOrgIds.length === 0 ? [] : ensureBlueberryIncluded(srcOrgIds);

  await replaceTargetsForTest(sb, newTestId, finalTargets);
}

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

export async function createTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const name = getStringTrimmed(formData, "name");
      const type = getStringTrimmed(formData, "type");
      const description = getStringOrNull(formData, "description");

      const exposure = getStringTrimmed(formData, "exposure");
      const targetOrgIds = normalizeTargetOrgIds(formData);

      if (!name || !type) {
        return { ok: false, error: "Nom et type obligatoires" };
      }

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
        const finalTargets = computeCatalogTargets({ exposure, targetOrgIds });
        await replaceTargetsForTest(ctx.sb, created.id, finalTargets);
      }

      revalidatePath("/tests");
      return { ok: true, data: created };
    } catch (e) {
      console.error("[createTestAction]", e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur création test",
      };
    }
  });
}

export async function updateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = getStringTrimmed(formData, "id");
      const name = getStringTrimmed(formData, "name");
      const description = getStringOrNull(formData, "description");

      const exposure = getStringTrimmed(formData, "exposure");
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
          const finalTargets = computeCatalogTargets({ exposure, targetOrgIds });
          await replaceTargetsForTest(ctx.sb, testId, finalTargets);
        }
      }

      revalidatePath("/tests");
      return { ok: true, data: updated };
    } catch (e) {
      console.error("[updateTestAction]", e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur update test",
      };
    }
  });
}

export async function duplicateTestAction(
  formData: FormData
): Promise<Ok<unknown> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = getStringTrimmed(formData, "testId");
      if (!testId) return { ok: false, error: "testId obligatoire" };

      const repo = makeTestRepo(ctx.sb);
      const usecase = makeDuplicateTest(repo);

      const duplicated = await usecase({
        orgId: ctx.orgId,
        testId,
        createdBy: ctx.userId,
      });

      // IMPORTANT: si c'est un test Blueberry, on copie ses targets
      // (et on garantit que Blueberry est inclus en targeted)
      await copyCatalogTargetsIfNeeded({
        sb: ctx.sb,
        ctx,
        sourceTestId: testId,
        newTestId: duplicated.id,
      });

      revalidatePath("/tests");
      return { ok: true, data: duplicated };
    } catch (e) {
      console.error("[duplicateTestAction]", e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur duplication",
      };
    }
  });
}

export async function deleteTestAction(
  formData: FormData
): Promise<Ok<null> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = getStringTrimmed(formData, "testId");
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
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur suppression test",
      };
    }
  });
}

export async function getTestTargetsAction(
  formData: FormData
): Promise<Ok<string[]> | Err> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = getStringTrimmed(formData, "testId");
      if (!testId) return { ok: false, error: "testId obligatoire" };

      // Pas blueberry_admin => on ne leak rien
      if (!canManageCatalog(ctx)) return { ok: true, data: [] };

      // Si pas un test Blueberry => []
      const catalog = await isBlueberryCatalogTest(ctx.sb, testId);
      if (!catalog) return { ok: true, data: [] };

      const orgIds = await getTargetsForTest(ctx.sb, testId);

      // On renvoie les targets telles quelles (on ne “corrige” pas ici),
      // car l’UI a besoin de refléter la vérité DB.
      return { ok: true, data: orgIds };
    } catch (e) {
      console.error("[getTestTargetsAction]", e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur get targets",
      };
    }
  });
}

export async function archiveTestAction(
  formData: FormData
): Promise<ArchiveOk | ArchiveErr> {
  return withAuth(async (ctx: Ctx) => {
    try {
      const testId = getStringTrimmed(formData, "testId");
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
