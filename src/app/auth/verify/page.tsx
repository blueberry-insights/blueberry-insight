import { resendSignupEmail } from "./action";

type VerifyPageProps = {
  searchParams?: Promise<{ email?: string; error?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const sp = (await searchParams) ?? {};

  const email =
    typeof sp.email === "string" && sp.email.trim().length > 0 ? sp.email : null;
  const error =
    typeof sp.error === "string" && sp.error.trim().length > 0 ? sp.error : null;

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold mb-3">Vérifie ta boîte mail</h1>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              Nous avons envoyé un lien de confirmation à{" "}
              <span className="font-medium text-foreground">{email}</span>. Ouvre cet email
              et clique sur le lien pour activer ton compte.
            </>
          ) : (
            <>
              Nous avons envoyé un lien de confirmation à ton adresse email. Ouvre cet email
              et clique sur le lien pour activer ton compte.
            </>
          )}
        </p>

        {error && !email && (
          <p className="mt-2 text-sm text-muted-foreground">
            Si le lien a expiré, entre ton email ci-dessous pour recevoir un nouveau lien.
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <a href="/login" className="text-primary hover:underline">
            Déjà confirmé ? Se connecter
          </a>
          {email ? (
            <form action={resendSignupEmail} className="inline-block">
              <input type="hidden" name="email" value={email} />
              <button className="hover:underline text-muted-foreground" type="submit">
                Renvoyer l&apos;email
              </button>
            </form>
          ) : (
            <form action={resendSignupEmail} className="inline-block">
              <input
                type="email"
                name="email"
                placeholder="ton@email.com"
                required
                className="mr-2 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <button className="hover:underline text-muted-foreground" type="submit">
                Renvoyer l&apos;email
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
