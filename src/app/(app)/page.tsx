
import { redirect } from "next/navigation";
import { supabaseServer } from "@/infra/supabase/server";

export default async function Home() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=%2F");
  }

  redirect("/dashboard"); 
}
