import { SupabaseAuth } from "@/infra/supabase/SupabaseAuth";
import { makeLoginUser } from "@/core/usecases/loginUser";
import { makeRegisterUser } from "@/core/usecases/registerUser";

const loginUser = makeLoginUser(SupabaseAuth);
const registerUser = makeRegisterUser(SupabaseAuth);

async function ensureOrg(orgName?: string) {
  const body = JSON.stringify({ orgName: orgName?.trim() || "" });
  await fetch("/api/ensure-org", { method: "POST", headers: { "content-type": "application/json" }, body })
    .catch(() => {});
}

export const services = {
  loginUser,
  registerUser,
  ensureOrg,
  signOut: () => SupabaseAuth.signOut(),
};
