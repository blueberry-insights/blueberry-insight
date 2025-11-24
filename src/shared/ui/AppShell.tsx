"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BriefcaseBusiness, FlaskConical, Boxes, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidats", icon: Users },
  { href: "/offers", label: "Offres", icon: BriefcaseBusiness },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/pool", label: "Vivier", icon: Boxes },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppShell({
  children,
  headerRightSlot,            // 👈 ex: <UserMenu .../>
  sidebarFooterSlot,          // ex: <ButtonLogout/>
  defaultCollapsed = false,
  autoCollapseOnNavigate = false, 
}: {
  children: React.ReactNode;
  headerRightSlot?: React.ReactNode;
  sidebarFooterSlot?: React.ReactNode;
  defaultCollapsed?: boolean;
  autoCollapseOnNavigate?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const widthOpen = 260;
  const widthClosed = 64;
  const navItems = useMemo(() => NAV, []);

  // Trouve le nom de la page courante
  const currentPageName = useMemo(() => {
    const item = navItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    return item?.label ?? "";
  }, [pathname, navItems]);

  return (
    <div className="auth-bg min-h-screen grid grid-cols-[auto_1fr] bg-background text-foreground">
      <aside
        id="app-sidebar"
        className="relative border-r bg-card grid transition-[width] duration-200 ease-out"
        style={{
          width: collapsed ? widthClosed : widthOpen,
          gridTemplateRows: "56px 1fr auto", 
          overflow: "visible",             
        }}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 grid place-items-center">
              <span className="text-primary font-bold">B</span>
            </div>
            <div
              className={[
                "leading-tight transition-all duration-200",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-[148px]",
              ].join(" ")}
              style={{ overflow: "hidden" }}
            >
              <div className="text-base font-semibold whitespace-nowrap">Blueberry Insight</div>
              <div className="text-[11px] text-muted-foreground">ATS</div>
            </div>
          </Link>
        </div>

        <nav className="px-2">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => {
                      if (!autoCollapseOnNavigate) return;
                      setCollapsed(true);
                    }}
                    className={[
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                      active ? "bg-secondary/10 font-medium" : "hover:bg-secondary/10",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span
                      className={[
                        "truncate transition-all duration-150",
                        collapsed ? "opacity-0 w-0" : "opacity-100 w-[148px]",
                      ].join(" ")}
                      style={{ overflow: "hidden" }}
                      title={label}
                      aria-hidden={collapsed}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-3 py-3">
          <div className="transition-all duration-200">
            {sidebarFooterSlot}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setCollapsed(v => !v); }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-card border rounded-full p-1.5 shadow-sm hover:bg-accent transition"
          aria-label={collapsed ? "Ouvrir la barre latérale" : "Fermer la barre latérale"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          {/* Titre de la page courante */}
          <h1 className="text-base font-semibold">{currentPageName}</h1>
          {/* Right slot → ton UserMenu ici */}
          <div className="flex items-center gap-3">{headerRightSlot}</div>
        </header>

        <section className="flex-1 p-6">{children}</section>
      </main>
    </div>
  );
}
