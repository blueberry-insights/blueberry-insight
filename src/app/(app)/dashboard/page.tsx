import { getSessionUser } from "@/infra/supabase/session";

type UserMetadata = {
  full_name?: string;
  [key: string]: unknown;
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  const meta = (user?.user_metadata ?? {}) as UserMetadata;
  const displayName = meta.full_name || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <div>
    <h1 className="text-xl font-semibold mb-4">Bienvenue, {displayName} !</h1>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 text-muted-foreground">
       <h1 className="text-lg font-semibold">Pipeline de candidats</h1>
       <p className="text-sm text-muted-foreground"> A venir…</p>
      </div>
      <div className="rounded-xl border bg-card p-4 text-muted-foreground"> 
        <h1 className="text-lg font-semibold">Test passés</h1>
        <p className="text-sm text-muted-foreground"> A venir…</p>
      </div>
    </div>
    </div>
  );
}
