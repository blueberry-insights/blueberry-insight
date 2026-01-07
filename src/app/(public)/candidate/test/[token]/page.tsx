// app/candidates/test/[token]/page.tsx
import CandidateTestClient from "./CandidateTestClient";
import CandidateFlowClient from "./CandidateFlowClient";
import { env } from "@/config/env";
import type { Test, TestQuestion, TestSubmission } from "@/core/models/Test";
import type { TestFlow } from "@/core/models/TestFlow";
import type { FlowItemWithContent } from "@/core/usecases/tests/invites/startFlowFromInvite";

type PageProps = {
  params: Promise<{ token: string }>;
};

type TestData =
  | {
      type: "completed";
      message: string;
    }
  | {
      type: "flow";
      flow: TestFlow;
      items: FlowItemWithContent[];
      currentItemIndex: number;
      currentItem: FlowItemWithContent;
    }
  | {
      type: "test";
      test: Test;
      submission: TestSubmission;
      questions: TestQuestion[];
    };

export default async function CandidateTestPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Token manquant dans l&apos;URL.</p>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-lg">
          <h1 className="text-xl font-semibold mb-2">Test déjà soumis ✅</h1>
          <p className="text-sm text-slate-600">
            Ce lien a déjà été utilisé (ou il a expiré). Vous pouvez fermer cette page.
          </p>
          <p className="text-xs text-slate-400 mt-3">Code {res.status}</p>
        </div>
      </div>
    );
  }

  const json: unknown = await res.json().catch(() => null);

  const ok =
    typeof json === "object" && json !== null && "ok" in json
      ? Boolean((json as { ok?: unknown }).ok)
      : false;

  const errorMsg =
    typeof json === "object" && json !== null && "error" in json
      ? String((json as { error?: unknown }).error ?? "")
      : "";

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-lg">
          <h1 className="text-xl font-semibold mb-2">Test indisponible</h1>
          <p className="text-sm text-slate-600">
            {errorMsg || "Erreur lors du chargement du test."}
          </p>
        </div>
      </div>
    );
  }

  const data =
    typeof json === "object" && json !== null && "data" in json
      ? (json as { data: TestData }).data
      : null;

  if (data?.type === "flow") {
    const { flow, items, currentItemIndex } = data;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-4xl p-6">
          <CandidateFlowClient
            token={token}
            flow={flow}
            items={items}
            currentItemIndex={currentItemIndex}
          />
        </div>
      </div>
    );
  }

  if (data?.type === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-lg">
          <h1 className="text-xl font-semibold mb-2">Test déjà soumis ✅</h1>
          <p className="text-sm text-slate-600">{data.message}</p>
        </div>
      </div>
    );
  }

  if (data?.type !== "test") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-lg">
          <h1 className="text-xl font-semibold mb-2">Test indisponible</h1>
          <p className="text-sm text-slate-600">
            Erreur lors du chargement du test.
          </p>
        </div>
      </div>
    );
  }

  const { test, submission, questions } = data;

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
