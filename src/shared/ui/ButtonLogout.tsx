
"use client";
import { logoutAction } from "@/app/(auth)/_actions";

export const ButtonLogout = () => (
  <form action={logoutAction} className="w-full mt-auto">
    <button
      type="submit"
      className="w-full rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
    >
      Se déconnecter
    </button>
  </form>
);
