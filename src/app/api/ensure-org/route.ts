import { NextResponse } from "next/server";
import { makeEnsureOrgOnFirstLogin } from "@/core/usecases/ensureOrgOnFirstLogin";
import { SupabaseOrgRepo } from "@/infra/supabase/SupabaseOrgRepo";
import { SupabaseMembershipRepo } from "@/infra/supabase/SupabaseMembershipRepo";
import { DefaultSlugger } from "@/infra/supabase/slugger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { AuthService } from "@/core/ports/AuthService";

const ServerAuthService: AuthService = {
  async currentUserId(): Promise<string | null> {
    const store = await (cookies() as any);
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => store.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();
    return user?.id ?? null;
  },
  async signIn() {
    throw new Error("not-implemented-here");
  },
  async signUp() {
    throw new Error("not-implemented-here");
  },
  async signOut() {
    // no-op ici, ce handler n’a pas besoin de signOut
  },
};

export async function POST(req: Request) {
  const { orgName } = (await req.json().catch(() => ({}))) as { orgName?: string };

  const ensureOrg = makeEnsureOrgOnFirstLogin({
    auth: ServerAuthService,
    orgs: SupabaseOrgRepo,
    memberships: SupabaseMembershipRepo,
    slugger: DefaultSlugger,
  });

  try {
    const result = await ensureOrg(orgName);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    const message = e?.message || "unknown-error";
    const status = message === "not-authenticated" ? 401 : 400;
    return NextResponse.json({ ok: false, reason: message }, { status });
  }
}
