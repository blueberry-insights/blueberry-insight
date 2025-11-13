
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/shared/ui/AppShell";
import { UserMenu } from "@/shared/ui/UserMenu";
import { ButtonLogout } from "@/shared/ui/ButtonLogout";
import { getSessionUser, getFirstMembership } from "@/infra/supabase/session";

function absoluteUrl(h: Headers, path = "/") {
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host")!;
    return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}
export default async function AppLayout({ children }: { children: ReactNode }) {
   
    const user = await getSessionUser();
    if (!user) redirect("/login?redirectedFrom=%2Fdashboard");

    let membership = await getFirstMembership(user.id);

    if (!membership) {
        const h = await headers();
        try {
            const res = await fetch(absoluteUrl(h, "/api/ensure-org"), {
                method: "POST",
                headers: { cookie: h.get("cookie") ?? "" },
                cache: "no-store",
                next: { revalidate: 0 },
            });

            if (res.status === 401) {
                redirect("/login?redirectedFrom=%2Fdashboard");
            }
        } catch (e) {
            console.log("[layout] ensure-org fetch error:", (e as Error).message);
        }
        membership = await getFirstMembership(user.id);
    }


    const orgName = membership?.organizations?.name ?? "";
    const displayName =
        (user.user_metadata as any)?.full_name ||
        user.email?.split("@")[0] ||
        "Utilisateur";

    const headerRightSlot = (
        <UserMenu
            size="sm"
            displayName={displayName}
            orgName={orgName}
            avatarUrl={(user.user_metadata as any)?.avatar_url}
        />
    );

    const sidebarFooterSlot = <ButtonLogout />;

    return (
        <AppShell
            headerRightSlot={headerRightSlot}
            sidebarFooterSlot={sidebarFooterSlot}
            defaultCollapsed={false}
            autoCollapseOnNavigate={false}
        >
            {!membership && (
                <div className="mx-4 my-2 rounded-md border border-yellow-300/40 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                    Initialisation de votre organisation… Si ce message persiste, rechargez la page.
                </div>
            )}
            {children}
        </AppShell>
    );
}
