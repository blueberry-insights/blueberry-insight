// src/app/api/candidates/[id]/cv/route.ts
import { NextResponse } from "next/server";
import { supabaseServerRSC } from "@/infra/supabase/client";
import { requireUserAndOrgForPage } from "@/infra/supabase/session";
import { makeCandidateRepo } from "@/infra/supabase/adapters/candidate.repo.supabase";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const candidateId = id;
  const { orgId } = await requireUserAndOrgForPage("/candidates/[id]");
  const sb = await supabaseServerRSC();
  const candidateRepo = makeCandidateRepo(sb);

  // 1) Récupérer le candidat via ton repo
  const candidate = await candidateRepo.getById(orgId, candidateId);

  console.log("[CV ROUTE DEBUG]", {
    candidateId,
    orgId,
    hasCandidate: !!candidate,
    cvPath: candidate?.cvPath,
    cvOriginalName: candidate?.cvOriginalName,
  });

  if (!candidate) {
    return new NextResponse("Candidat introuvable", { status: 404 });
  }

  if (!candidate.cvPath) {
    return new NextResponse("Aucun CV attaché à ce candidat", { status: 404 });
  }

  const sbStorage = sb; 
  const { data: signed, error: signedError } = await sbStorage.storage
    .from("candidate-cv")
    .createSignedUrl(candidate.cvPath, 60);

  if (signedError || !signed?.signedUrl) {
    console.error(
      "[GET /api/candidates/[id]/cv] signedUrl error",
      signedError
    );
    return new NextResponse(
      "Impossible de générer le lien de téléchargement",
      { status: 500 }
    );
  }

  // 3) Redirection vers l’URL signée
  return NextResponse.redirect(signed.signedUrl);
}
