export function sanitizeRedirect(input: unknown, fallback = "/dashboard") {
  const v = String(input ?? "").trim();
  if (!v || v === "undefined" || v === "null") return fallback;
  if (!v.startsWith("/")) return fallback;
  if (v === "/login" || v === "/register" || v.startsWith("/auth/")) return fallback;
  return v;
}
