import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/infra/supabase/session";

export default async function Home() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?redirectedFrom=%2F");
  }

  redirect("/dashboard");
}
