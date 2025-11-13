import { NextResponse } from "next/server";
import { supabaseServerAction } from "@/infra/supabase/client";
import { makeEnsureOrgOnFirstLogin } from "@/core/usecases/ensureOrgOnFirstLogin";
import { makeOrgRepo } from "@/infra/supabase/adapters/org.repo.supabase";
import { makeMembershipRepo } from "@/infra/supabase/adapters/membership.repo.supabase";
import { DefaultSlugger } from "@/infra/supabase/utils/slugger";
import { makeSessionReaderAction } from "@/infra/supabase/adapters/session.reader.supabase";

export async function POST() {
  const sb = await supabaseServerAction();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "not-authenticated" }, { status: 401 });

  const ensureOrg = makeEnsureOrgOnFirstLogin({
    auth: makeSessionReaderAction(),
    orgs: makeOrgRepo(sb),
    memberships: makeMembershipRepo(sb),
    slugger: DefaultSlugger,
  });

  const candidateName = String((user.user_metadata as any)?.org_name || "");
  try {
    const result = await ensureOrg(candidateName);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    const code = e?.code ?? e?.cause?.code ?? null;
    const msg = e?.message || "unknown-error";
    const status = msg === "not-authenticated" ? 401 : code === "23505" ? 409 : 400;
    return NextResponse.json({ ok: false, code, reason: msg }, { status });
  }
}