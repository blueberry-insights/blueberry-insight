"use client";

import { logoutAction } from "@/app/(auth)/_actions";
import { LogOut } from "lucide-react";

export function ButtonLogout() {
  return (
    <form action={logoutAction} className="w-full mt-auto">
      <button
        type="submit"
        className="
          group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm
          text-slate-600 hover:bg-slate-100 transition-colors border border-transparent
          hover:border-slate-200
        "
      >
        <LogOut className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-700" />

        <span
          className="
            truncate transition-all duration-150
            group-hover:text-slate-700
          "
        >
          Se déconnecter
        </span>
      </button>
    </form>
  );
}
