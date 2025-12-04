import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infra/supabase/types/Database";
import type {
  OfferRepo,
  CreateOfferInput,
  UpdateOfferInput,
} from "@/core/ports/OfferRepo";
import type { Offer, OfferListItem, OfferStatus } from "@/core/models/Offer";
import { supabaseAdmin } from "@/infra/supabase/client";

type Db = SupabaseClient<Database>;

export function makeOfferRepo(sb: Db): OfferRepo {
  return {
    async listByOrg(orgId: string): Promise<OfferListItem[]> {
      const { data, error } = await sb
        .from("offers")
        .select(
          `
          id,
          title,
          description,
          status,
          created_at,
          updated_at,
          city,
          country,
          is_remote,
          remote_policy,
          contract_type,
          salary_min,
          salary_max,
          currency,
          created_by,
          responsible_user_id,
          candidates(count)
        `
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
    
      if (error) throw error;
      
      // Récupérer tous les userId uniques (created_by + responsible_user_id)
      const userIds = Array.from(
        new Set(
          (data ?? [])
            .flatMap((row) => [row.created_by, row.responsible_user_id])
            .filter((id): id is string => id !== null)
        )
      );

      // Paralléliser les appels avec Promise.all pour optimiser les performances
      // Utiliser le client admin pour accéder aux données utilisateurs
      const userNames = new Map<string, string>();
      const adminClient = supabaseAdmin();
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const { data: userData } = await adminClient.auth.admin.getUserById(userId);
            if (userData?.user?.user_metadata?.full_name) {
              userNames.set(userId, userData.user.user_metadata.full_name);
            }
          } catch (err) {
            console.warn(`Unable to fetch user ${userId}:`, err);
          }
        })
      );

      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? null,
        status: row.status as OfferListItem["status"],
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? null,
        city: row.city ?? null,
        country: row.country ?? null,
        isRemote: row.is_remote ?? false,
        remotePolicy: row.remote_policy ?? null,
        contractType: row.contract_type ?? null,
        salaryMin: row.salary_min ?? null,
        salaryMax: row.salary_max ?? null,
        currency: row.currency ?? null,

        createdBy: row.created_by ?? null,
        createdByName: row.created_by
          ? userNames.get(row.created_by) ?? null
          : null,

        responsibleUserId: row.responsible_user_id ?? null,
        responsibleUserName: row.responsible_user_id
          ? userNames.get(row.responsible_user_id) ?? null
          : null,

        candidateCount: row.candidates?.[0]?.count ?? 0,
      }));
    },


    async getById(orgId: string, offerId: string): Promise<Offer | null> {
      const { data, error } = await sb
        .from("offers")
        .select(
          `
          id,
          org_id,
          title,
          description,
          status,
          created_at,
          updated_at,
          city,
          country,
          is_remote,
          remote_policy,
          contract_type,
          salary_min,
          salary_max,
          currency,
          created_by,
          responsible_user_id
        `
        )
        .eq("org_id", orgId)
        .eq("id", offerId)
        .single();

      if (error) return null;
      if (!data) return null;

      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description ?? null,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        isRemote: data.is_remote ?? false,
        remotePolicy: data.remote_policy ?? null,
        contractType: data.contract_type ?? null,
        salaryMin: data.salary_min ?? null,
        salaryMax: data.salary_max ?? null,
        currency: data.currency ?? null,
        createdBy: data.created_by ?? null,
        responsibleUserId: data.responsible_user_id ?? null,
      };
    },

    async create(input: CreateOfferInput): Promise<Offer> {
      const {
        orgId,
        title,
        description,
        status = "draft",
        city,
        country,
        isRemote,
        remotePolicy,
        contractType,
        salaryMin,
        salaryMax,
        currency,
        createdBy,
        responsibleUserId,
      } = input;

      const { data, error } = await sb
        .from("offers")
        .insert({
          org_id: orgId,
          title,
          description: description ?? null,
          status,
          city: city ?? null,
          country: country ?? null,
          is_remote: isRemote ?? false,
          remote_policy: remotePolicy ?? null,
          contract_type: contractType ?? null,
          salary_min: salaryMin ?? null,
          salary_max: salaryMax ?? null,
          currency: currency ?? "EUR",
          created_by: createdBy, // User qui a créé l'offre
          responsible_user_id: responsibleUserId, // User responsable de l'offre
        })
        .select(
          `
          id,
          org_id,
          title,
          description,
          status,
          created_at,
          updated_at,
          city,
          country,
          is_remote,
          remote_policy,
          contract_type,
          salary_min,
          salary_max,
          currency,
          created_by,
          responsible_user_id
        `
        )
        .single();

      if (error || !data) throw error ?? new Error("Insert failed");

      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description ?? null,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        isRemote: data.is_remote ?? false,
        remotePolicy: data.remote_policy ?? null,
        contractType: data.contract_type ?? null,
        salaryMin: data.salary_min ?? null,
        salaryMax: data.salary_max ?? null,
        currency: data.currency ?? null,
        createdBy: data.created_by ?? null,
        responsibleUserId: data.responsible_user_id ?? null,
      };
    },

    async update(input: UpdateOfferInput): Promise<Offer> {
      const {
        orgId,
        offerId,
        title,
        description,
        status,
        city,
        country,
        isRemote,
        remotePolicy,
        contractType,
        salaryMin,
        salaryMax,
        currency,
      } = input;
    
      const { data, error } = await sb
        .from("offers")
        .update({
          title,
          description: description ?? null,
          status,
    
          city: city ?? null,
          country: country ?? null,
          is_remote: isRemote ?? false,
          remote_policy: remotePolicy ?? null,
          contract_type: contractType ?? null,
          salary_min: salaryMin ?? null,
          salary_max: salaryMax ?? null,
          currency: currency ?? null,
        })
        .eq("org_id", orgId)
        .eq("id", offerId)
        .select(
          `
          id,
          org_id,
          title,
          description,
          status,
          created_at,
          updated_at,
          city,
          country,
          is_remote,
          remote_policy,
          contract_type,
          salary_min,
          salary_max,
          currency,
          created_by,
          responsible_user_id
        `
        )
        .single();
    
      if (error || !data) throw error ?? new Error("Update failed");
    
      return {
        id: data.id,
        orgId: data.org_id,
        title: data.title,
        description: data.description ?? null,
        status: data.status as OfferStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        isRemote: data.is_remote ?? false,
        remotePolicy: data.remote_policy ?? null,
        contractType: data.contract_type ?? null,
        salaryMin: data.salary_min ?? null,
        salaryMax: data.salary_max ?? null,
        currency: data.currency ?? null,
        createdBy: data.created_by ?? null,
        responsibleUserId: data.responsible_user_id ?? null,
      };
    },
    async deleteById(input: { orgId: string; offerId: string }): Promise<void> {
      const { error } = await sb
        .from("offers")
        .delete()
        .eq("org_id", input.orgId)
        .eq("id", input.offerId);
      if (error) throw error;
    }
  };
    
}
