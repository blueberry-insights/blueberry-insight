// src/infra/supabase/composition.ts
import { supabaseServerAction, supabaseServerRSC } from "./client";
import { authServiceSupabase } from "./adapters/auth.service.supabase";

export async function makeAuthServiceForAction() {
  const sb = await supabaseServerAction();
  return authServiceSupabase(sb);
}

export async function makeAuthServiceForRSC() {
  const sb = await supabaseServerRSC();
  return authServiceSupabase(sb);
}
