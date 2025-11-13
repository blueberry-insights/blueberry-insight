import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;

export function middleware(req: NextRequest) {
  // Si pas de config → on laisse tout passer (pratique en local)
  if (!USER || !PASS) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Laisse passer les assets statiques & Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
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

// Applique le middleware partout sauf assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
