import "server-only";
import { redirect } from "next/navigation";
import { supabaseServerRSC } from "@/infra/supabase/client"; 

export default async function Home() {
  const sb = await supabaseServerRSC(); 
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=%2F");
  }

  redirect("/dashboard");
}
