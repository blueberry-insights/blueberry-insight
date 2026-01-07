"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUserAndOrgForAction } from "@/infra/supabase/session";
import { supabaseServerAction } from "@/infra/supabase/client";
import { makeMembershipRepo } from "@/infra/supabase/adapters/membership.repo.supabase";

export async function setActiveOrgAction(orgId: string) {
  const user = await requireUserAndOrgForAction();

  const sb = await supabaseServerAction();
  const membershipRepo = makeMembershipRepo(sb);

  const isMember = await membershipRepo.isMember(user.userId, orgId);
  if (!isMember) {
    throw new Error("forbidden-org");
  }

  const jar = await cookies(); // ✅ IMPORTANT
  jar.set("active_org_id", orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
