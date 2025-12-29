// src/infra/supabase/composition.ts
import { supabaseAdmin, supabaseServerAction, supabaseServerRSC } from "./client";
import { authServiceSupabase } from "./adapters/auth.service.supabase";
import { makeCandidateRepo } from "./adapters/candidate.repo.supabase";
import { makeTestInviteRepo } from "./adapters/testInvite.repo.supabase";
import { makeTestRepo } from "./adapters/test.repo.supabase";

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


export function makeTestInfraForServiceRole() {
  const sb = supabaseAdmin();

  const testRepo = makeTestRepo(sb);
  const testInviteRepo = makeTestInviteRepo(sb);

  return { sb, testRepo, testInviteRepo };
}