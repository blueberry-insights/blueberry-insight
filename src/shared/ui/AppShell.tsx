"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BriefcaseBusiness, FlaskConical, Boxes, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidats", icon: Users },
  { href: "/offers", label: "Offres", icon: BriefcaseBusiness },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/pool", label: "Vivier", icon: Boxes },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppShell({ children, userSlot }: { children: React.ReactNode, userSlot?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background text-foreground">
      <aside className="border-r bg-card">
        <div className="p-4">
          <div className="text-xl font-semibold">Blueberry Insight</div>
          <div className="text-xs text-muted-foreground">ATS</div>
        </div>
        <div className="h-px bg-border" />
        <nav className="p-2">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      active ? "bg-secondary/10 font-medium" : "hover:bg-secondary/10"
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-end gap-4 border-b p-4">
          {userSlot}
        </header>
        <section className="flex-1 p-6">{children}</section>
      </main>
    </div>
  );
}
