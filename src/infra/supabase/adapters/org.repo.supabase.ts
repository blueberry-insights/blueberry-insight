// infra/supabase/repos/org.repo.supabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Org, OrgRepo } from "@/core/ports/OrgRepo";
import { randomUUID } from "node:crypto";

export function makeOrgRepo(sb: SupabaseClient): OrgRepo {
  return {
    async findBySlug(slug) {
      const { data, error } = await sb
        .from("organizations")
        .select("id,name,slug,created_by")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { id: data.id, name: data.name, slug: data.slug, createdBy: data.created_by };
    },

    async create(name, slug, createdBy) {
      const id = randomUUID(); // 👈 on fixe l'ID côté serveur
      // ⚠️ AUCUN .select() ici
      const { error } = await sb
        .from("organizations")
        .insert([{ id, name, slug, created_by: createdBy }]); // WITH CHECK ok
      if (error) throw error;

      // On retourne ce qu’on sait déjà (pas besoin de SELECT)
      return { id, name, slug, createdBy };
    },
    async getById(orgId: string): Promise<Org | null> {
      const { data, error } = await sb
        .from("organizations")
        .select("id, name, slug, created_by")
        .eq("id", orgId)
        .single();
      if (error) return null;
      return { id: data.id, name: data.name, slug: data.slug, createdBy: data.created_by};
    },
  };
}
