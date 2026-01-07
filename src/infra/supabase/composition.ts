// src/infra/supabase/composition.ts
import { supabaseAdmin, supabaseServerAction, supabaseServerRSC } from "./client";
import { authServiceSupabase } from "./adapters/auth.service.supabase";
import { makeCandidateRepo } from "./adapters/candidate.repo.supabase";
import { makeTestInviteRepo } from "./adapters/testInvite.repo.supabase";
import { makeTestRepo } from "./adapters/test.repo.supabase";
import { makeUserInfoRepo } from "./adapters/userInfo.repo.supabase";

export async function makeAuthServiceForAction() {
  const sb = await supabaseServerAction();
  return authServiceSupabase(sb);
}

export async function makeAuthServiceForRSC() {
  const sb = await supabaseServerRSC();
  return authServiceSupabase(sb);
}

export async function makeCandidateRepoForRSC() {
  const sb = await supabaseServerRSC();
  return makeCandidateRepo(sb);
}


/**
 * @deprecated Cette fonction n'est plus utilisée.
 * Les routes API publiques utilisent maintenant `supabaseAnon()` au lieu de `supabaseAdmin()`.
 * Voir `src/app/api/candidate/test/[token]/route.ts` pour l'implémentation actuelle.
 */
export function makeTestInfraForServiceRole() {
  const sb = supabaseAdmin();

  const testRepo = makeTestRepo(sb);
  const testInviteRepo = makeTestInviteRepo(sb);

  return { sb, testRepo, testInviteRepo };
}

/**
 * Factory pour créer le UserInfoRepo.
 * Utilise le client admin car l'API auth.admin nécessite le service role.
 */
export function makeUserInfoRepoForAction() {
  return makeUserInfoRepo();
}