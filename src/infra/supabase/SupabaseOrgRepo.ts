import type { Org, OrgRepo } from "@/core/ports/OrgRepo";
import { supabaseServer } from "./server";

export const SupabaseOrgRepo: OrgRepo = {
  async findBySlug(slug) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("organizations").select("id,name,slug,created_by").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id, name: data.name, slug: data.slug, createdBy: data.created_by } satisfies Org;
  },
  async create(name, slug, createdBy) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("organizations")
      .insert({ name, slug, created_by: createdBy })
      .select("id,name,slug,created_by")
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, slug: data.slug, createdBy: data.created_by } satisfies Org;
  },
};
