"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { services } from "@/app/container";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectedFrom") || "/candidates";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await services.loginUser(email, password);
    router.refresh();
    const orgName = localStorage.getItem("pendingOrgName") || "";
    await services.ensureOrg(orgName || undefined);
    if (orgName) localStorage.removeItem("pendingOrgName");

    router.replace(redirectTo);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
        <h1 className="text-lg font-semibold">Connexion</h1>
        <input className="w-full rounded-lg border p-2" placeholder="email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded-lg border p-2" type="password" placeholder="mot de passe"
               value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:opacity-90">
          Se connecter
        </button>
      </form>
    </div>
  );
}
