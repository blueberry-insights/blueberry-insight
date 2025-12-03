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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Welcome Back, {displayName} !</h1>
      <div className="rounded-xl border bg-card p-4 text-muted-foreground">
        Dashboard à venir…
      </div>
    </div>
  );
}
