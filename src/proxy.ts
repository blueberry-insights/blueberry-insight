import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/config/env";

const USER = env.BASIC_AUTH_USER;
const PASS = env.BASIC_AUTH_PASS;

export function proxy(req: NextRequest) {
  // Si pas de config → on laisse tout passer (pratique en local)
  if (!USER || !PASS) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // ✅ On laisse passer le tunnel candidat SANS Basic Auth
  if (
    pathname.startsWith("/candidate/test") ||
    pathname.startsWith("/api/candidate/test")
  ) {
    return NextResponse.next();
  }

  // Laisse passer les assets statiques & Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Laisse passer les routes d'authentification
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Basic ")) {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Protected Area"',
      },
    });
  }

  const base64 = auth.split(" ")[1] ?? "";
  const [user, pass] = atob(base64).split(":");

  if (user === USER && pass === PASS) {
    return NextResponse.next();
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Area"',
    },
  });
}

// Applique le proxy partout (on peut garder le matcher comme ça)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/candidate/test/:path*"],
};
