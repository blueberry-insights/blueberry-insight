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
          "id, full_name, email, status, source, tags, note, created_at, offer_id, cv_path, cv_original_name, cv_mime_type, cv_size_bytes, cv_uploaded_at", 
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
        cvPath: row.cv_path ?? null,
        cvOriginalName: row.cv_original_name ?? null,
        cvMimeType: row.cv_mime_type ?? null,
        cvSizeBytes: row.cv_size_bytes ?? null,
        cvUploadedAt: row.cv_uploaded_at ?? null,
      }));
    },
    async getById(orgId: string, candidateId: string): Promise<CandidateListItem | null> {
      const { data, error } = await sb
        .from("candidates")
        .select(
          `
            id,
            full_name,
            email,
            status,
            source,
            tags,
            note,
            created_at,
            offer_id,
            cv_path,
            cv_original_name,
            cv_mime_type,
            cv_size_bytes,
            cv_uploaded_at
          `
        )
        .eq("org_id", orgId)
        .eq("id", candidateId)
        .single();
    
      if (error) {
        if (error.code === "PGRST116") {
 
          return null;
        }
        throw error;
      }
    
      if (!data) return null;
    
      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        status: (data.status as CandidateStatus | null) ?? null,
        source: data.source ?? null,
        tags: (data.tags as string[] | null) ?? [],
        note: data.note ?? null,
        createdAt: data.created_at,
        offerId: data.offer_id ?? null,
  
        cvPath: data.cv_path ?? null,
        cvOriginalName: data.cv_original_name ?? null,
        cvMimeType: data.cv_mime_type ?? null,
        cvSizeBytes: data.cv_size_bytes ?? null,
        cvUploadedAt: data.cv_uploaded_at ?? null,
      };
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
        .update({ note: note })
        .eq("id", candidateId)
        .eq("org_id", orgId)
        .select("id, full_name, email, status, source, tags, note, created_at, offer_id, cv_path, cv_original_name, cv_mime_type, cv_size_bytes, cv_uploaded_at")
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
        cvPath: data.cv_path ?? null,
        cvOriginalName: data.cv_original_name ?? null,
        cvMimeType: data.cv_mime_type ?? null,
        cvSizeBytes: data.cv_size_bytes ?? null,
        cvUploadedAt: data.cv_uploaded_at ?? null,
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
        offerId
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
          offer_id: offerId
        })
        .select("id, full_name, email, status, source, tags, note, created_at, offer_id, cv_path, cv_original_name, cv_mime_type, cv_size_bytes, cv_uploaded_at")
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
        cvPath: data.cv_path ?? null,
        cvOriginalName: data.cv_original_name ?? null,
        cvMimeType: data.cv_mime_type ?? null,
        cvSizeBytes: data.cv_size_bytes ?? null,
        cvUploadedAt: data.cv_uploaded_at ?? null,
      };
    },
    async attachCv({
      orgId,
      candidateId,
      cvPath,
      originalName,
      mimeType,
      sizeBytes,
      uploadedAt,
    }: {
      orgId: string;
      candidateId: string;
      cvPath: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedAt: string;
    }): Promise<CandidateListItem> {
      const { data, error } = await sb
        .from("candidates")
        .update({
          cv_path: cvPath,
          cv_original_name: originalName,
          cv_mime_type: mimeType,
          cv_size_bytes: sizeBytes,
          cv_uploaded_at: uploadedAt,
        } as any) // TS râlera car Insert/Update n'ont pas ces champs → à harmoniser plus tard
        .eq("id", candidateId)
        .eq("org_id", orgId)
        .select(
          "id, full_name, email, status, source, tags, note, created_at, offer_id, cv_path, cv_original_name, cv_mime_type, cv_size_bytes, cv_uploaded_at"
        )
        .single();
    
      if (error || !data) throw error ?? new Error("Attach CV failed");
    
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
        cvPath: data.cv_path ?? null,
        cvOriginalName: data.cv_original_name ?? null,
        cvMimeType: data.cv_mime_type ?? null,
        cvSizeBytes: data.cv_size_bytes ?? null,
        cvUploadedAt: data.cv_uploaded_at ?? null,
      };
    }    
  };
}
