import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirectedFrom?: string;
    reset?: string;
  }>;
};

function sanitizeRedirect(v: string | null): string {
  if (!v) return "/dashboard";
  if (!v.startsWith("/")) return "/dashboard";
  if (v === "/login" || v === "/register" || v.startsWith("/auth/")) return "/dashboard";
  return v;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = (await searchParams) ?? {};

  const serverError = sp.error ? decodeURIComponent(sp.error) : null;
  const redirectTo = sanitizeRedirect(sp.redirectedFrom ?? null);
  const resetSuccess = sp.reset === "success";

  return (
    <LoginForm
      serverError={serverError}
      redirectTo={redirectTo}
      resetSuccess={resetSuccess}
    />
  );
}
