"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  FlaskConical,
  Boxes,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

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
  headerRightSlot,
  sidebarFooterSlot,
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

  const currentPageName = useMemo(() => {
    const item = navItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    return item?.label ?? "";
  }, [pathname, navItems]);

  return (
    <div className="auth-bg min-h-screen grid grid-cols-[auto_1fr] bg-background text-foreground">
      {/* SIDEBAR */}
      <aside
        id="app-sidebar"
        className="relative border-r bg-white/30 backdrop-blur-xl transition-[width] shadow-sm duration-200 ease-in-out"
        style={{ width: collapsed ? widthClosed : widthOpen }}
      >

        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-14 items-center px-3">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="relative h-10 w-10 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Blueberry Insight"
                  className="h-full w-full object-contain"
                  width={64}
                  height={64}
                />
              </div>

              <div
                className={[
                  "leading-tight transition-all duration-200",
                  collapsed ? "opacity-0 w-0" : "opacity-100 w-[148px]",
                ].join(" ")}
                style={{ overflow: "hidden" }}
              >
                <div className="text-sm font-semibold whitespace-nowrap">
                  Blueberry Insight
                </div>
                <div className="text-[11px] text-muted-foreground">ATS</div>
              </div>
            </Link>
          </div>

          {/* NAV */}
          <nav
            className="flex-1 px-2 pb-2 pt-1 overflow-y-auto"
            aria-label="Navigation principale"
          >
            <ul className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");

                const linkBaseClasses =
                  "flex min-w-0 items-center rounded-lg px-2 py-2 text-sm transition-colors";

                const linkActiveClasses = collapsed
                  ? "text-slate-900"
                  : "bg-slate-900 text-slate-50 shadow-sm";

                const linkInactiveClasses = "text-slate-600 hover:bg-slate-100";

                return (
                  <li key={href} className="min-w-0">
                    <Link
                      href={href}
                      onClick={() => {
                        if (!autoCollapseOnNavigate) return;
                        setCollapsed(true);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={[
                        linkBaseClasses,
                        collapsed ? "justify-center" : "gap-3",
                        active ? linkActiveClasses : linkInactiveClasses,
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          active && collapsed
                            ? "bg-slate-900 text-slate-50 shadow-sm"
                            : "",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </span>

                      <span
                        className={[
                          "min-w-0 truncate transition-all duration-150",
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
          <div className="shrink-0 border-t px-3 py-3">
            <div className="transition-all duration-200">
              {sidebarFooterSlot}
            </div>
          </div>
        </div>

        {/* BOUTON COLLAPSE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((v) => !v);
          }}
          className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border bg-white/90 p-1.5 shadow-sm backdrop-blur-sm hover:bg-slate-50 transition"
          aria-label={
            collapsed ? "Ouvrir la barre latérale" : "Fermer la barre latérale"
          }
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          type="button"
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
        <header className="flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-sm">
          <h1 className="text-sm font-semibold text-slate-900">
            {currentPageName}
          </h1>
          <div className="flex items-center gap-3">{headerRightSlot}</div>
        </header>

        <section className="flex-1 bg-slate-50/60 p-6">{children}</section>
      </main>
    </div>
  );
}
