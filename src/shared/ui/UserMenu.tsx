"use client";

import { useRouter } from "next/navigation";
import { services } from "@/app/container";
import { useState } from "react";

type Props = {
  displayName: string;
  orgName?: string;
  avatarUrl?: string | null;
};

export function UserMenu({ displayName, orgName, avatarUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    await services.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .join("")
        .slice(0, 2)
    : "?";

  return (
    <div className="flex h-full flex-col items-center justify-between py-4">
      {/* TOP : Avatar + infos */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center text-lg font-semibold text-primary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="text-sm font-medium">{displayName}</div>
        {orgName && (
          <div className="text-xs text-muted-foreground">{orgName}</div>
        )}
      </div>

      {/* BOTTOM : Logout */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full mt-auto rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
      >
        {loading ? "Déconnexion..." : "Se déconnecter"}
      </button>
    </div>
  );
}
