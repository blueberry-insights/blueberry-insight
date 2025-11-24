import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";
import type { CandidateRepo, CreateCandidateInput } from "@/core/ports/CandidateRepo";
import type { CandidateListItem, CandidateStatus } from "@/core/models/Candidate";

type Db = SupabaseClient<Database>;

export function makeCandidateRepo(sb: Db): CandidateRepo {
  return {
    async listByOrg(orgId: string): Promise<CandidateListItem[]> {
      const { data, error } = await sb
        .from("candidates")
        .select(
          "id, full_name, email, status, source, tags, note, created_at, offer_id", 
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        fullName: row.full_name,
        offerId: row.offer_id ?? null,
        email: row.email,
        status: (row.status as CandidateStatus | null) ?? null,
        source: row.source ?? null,
        tags: (row.tags as string[] | null) ?? [],
        note: row.note ?? null,
        createdAt: row.created_at,
      }));
    },
    async updateNote({
      orgId,
      candidateId,
      note,
    }: {
      orgId: string;
      candidateId: string;
      note: string | null;
    }): Promise<CandidateListItem> {
      const { data, error } = await sb
        .from("candidates")
        .update({ notes: note })
        .eq("id", candidateId)
        .eq("org_id", orgId)
        .select("id, full_name, email, status, source, tags, note:notes, created_at, offer_id")
        .single();

      if (error || !data) throw error ?? new Error("Update failed");

      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        status: (data.status as CandidateStatus | null) ?? null,
        source: data.source ?? null,
        tags: (data.tags as string[] | null) ?? [],
        note: data.note ?? null,
        offerId: data.offer_id ?? null,
        createdAt: data.created_at,
      };
    },

    async create(input: CreateCandidateInput): Promise<CandidateListItem> {
      const {
        orgId,
        fullName,
        email,
        status = "new",
        source,
        tags,
        note,
      } = input;
      const { data, error } = await sb
        .from("candidates")
        .insert({
          org_id: orgId,
          full_name: fullName,
          email: email ?? null,
          status,
          source: source ?? null,
          tags: tags && tags.length ? tags : null,
          note: note ?? null,
        })
        .select("id, full_name, email, status, source, tags, note, created_at, offer_id")
        .single();

      if (error || !data) throw error ?? new Error("Insert failed");

      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        status: (data.status as CandidateStatus | null) ?? null,
        source: data.source ?? null,
        offerId: data.offer_id ?? null,
        tags: (data.tags as string[] | null) ?? [],
        note: data.note ?? null,
        createdAt: data.created_at,
      };
    },
  };
}
