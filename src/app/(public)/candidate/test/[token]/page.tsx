// app/candidates/test/[token]/page.tsx
import CandidateTestClient from "./CandidateTestClient";
import CandidateFlowClient from "./CandidateFlowClient";
import { env } from "@/config/env";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function CandidateTestPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Token manquant dans l'URL.</p>
      </div>
    );
  }

  const baseUrl =
    env.NEXT_PUBLIC_APP_URL ??
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/candidate/test/${token}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Impossible de charger le test. (code {res.status})</p>
      </div>
    );
  }

  const json = await res.json();

  if (!json.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{json.error ?? "Erreur lors du chargement du test."}</p>
      </div>
    );
  }

  // Si c'est un flow, utiliser CandidateFlowClient
  if (json.data.type === "flow") {
    const { flow, items, currentItemIndex, currentItem } = json.data;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-4xl p-6">
          <CandidateFlowClient
            token={token}
            flow={flow}
            items={items}
            currentItemIndex={currentItemIndex}
            currentItem={currentItem}
          />
        </div>
      </div>
    );
  }

  // Sinon, utiliser le comportement classique (test seul)
  const { test, submission, questions } = json.data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-2xl p-6">
        <CandidateTestClient
          token={token}
          test={test}
          submission={submission}
          questions={questions}
        />
      </div>
    </div>
  );
}
