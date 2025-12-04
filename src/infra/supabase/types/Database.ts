
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    created_at?: string;
                };
                Update: Partial<{
                    id: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    created_at: string;
                }>;
                Relationships: [];
            };

            user_organizations: {
                Row: {
                    user_id: string;
                    org_id: string;
                    role: "owner" | "admin" | "recruiter" | "viewer";
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    org_id: string;
                    role?: "owner" | "admin" | "recruiter" | "viewer";
                    created_at?: string;
                };
                Update: Partial<{
                    user_id: string;
                    org_id: string;
                    role: "owner" | "admin" | "recruiter" | "viewer";
                    created_at: string;
                }>;
                Relationships: [
                    {
                        foreignKeyName: "user_organizations_org_id_fkey";
                        columns: ["org_id"];
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };

            org_invitations: {
                Row: {
                    id: string;
                    org_id: string;
                    email: string;
                    role: "admin" | "recruiter" | "viewer";
                    invited_by: string;
                    token: string;
                    status: "pending" | "accepted" | "expired" | "revoked";
                    expires_at: string;
                    created_at: string;
                    accepted_at: string | null;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    email: string;
                    role: "admin" | "recruiter" | "viewer";
                    invited_by: string;
                    token: string;
                    status?: "pending" | "accepted" | "expired" | "revoked";
                    expires_at: string;
                    created_at?: string;
                    accepted_at?: string | null;
                };
                Update: Partial<{
                    id: string;
                    org_id: string;
                    email: string;
                    role: "admin" | "recruiter" | "viewer";
                    invited_by: string;
                    token: string;
                    status: "pending" | "accepted" | "expired" | "revoked";
                    expires_at: string;
                    created_at: string;
                    accepted_at: string | null;
                }>;
                Relationships: [
                    {
                        foreignKeyName: "org_invitations_org_id_fkey";
                        columns: ["org_id"];
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "org_invitations_invited_by_fkey";
                        columns: ["invited_by"];
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };

            candidates: {
                Row: {
                  id: string;
                  org_id: string;
                  full_name: string;
                  email: string | null;
                  source: string | null;
                  note: string | null;
                  offer_id: string | null;
                  created_at: string;
                  updated_at: string | null;
                  status:
                    | "new"
                    | "screening"
                    | "test"
                    | "interview"
                    | "offer"
                    | "hired"
                    | "archived"
                    | "rejected"
                    | null;
                  cv_path: string | null;
                  cv_original_name: string | null;
                  cv_mime_type: string | null;
                  cv_size_bytes: number | null;
                  cv_uploaded_at: string | null;
                  tags: string[]; 
                };
                Insert: {
                  id?: string;
                  org_id: string;
                  full_name: string;
                  email?: string | null;
                  source?: string | null;
                  note?: string | null;
                  offer_id?: string | null;
                  created_at?: string;
                  updated_at?: string | null;
                  status?:
                    | "new"
                    | "screening"
                    | "test"
                    | "interview"
                    | "offer"
                    | "hired"
                    | "archived"
                    | "rejected"
                    | null;
              
                  cv_path?: string | null;
                  cv_original_name?: string | null;
                  cv_mime_type?: string | null;
                  cv_size_bytes?: number | null;
                  cv_uploaded_at?: string | null;
                  tags?: string[]; // optionnel côté insert, la DB mettra {} par défaut si tu l'as configuré comme ça
                };
                Update: Partial<{
                  id: string;
                  org_id: string;
                  full_name: string;
                  email: string | null;
                  source: string | null;
                  note: string | null;
                  offer_id: string | null;
                  created_at: string;
                  updated_at: string | null;
                  status:
                    | "new"
                    | "screening"
                    | "test"
                    | "interview"
                    | "offer"
                    | "hired"
                    | "archived"
                    | "rejected"
                    | null;
                  cv_path: string | null;
                  cv_original_name: string | null;
                  cv_mime_type: string | null;
                  cv_size_bytes: number | null;
                  cv_uploaded_at: string | null;
                  tags: string[];
                }>;
                Relationships: [
                  {
                    foreignKeyName: "candidates_org_id_fkey";
                    columns: ["org_id"];
                    referencedRelation: "organizations";
                    referencedColumns: ["id"];
                  },
                  {
                    foreignKeyName: "candidates_offer_id_fkey";
                    columns: ["offer_id"];
                    referencedRelation: "offers";
                    referencedColumns: ["id"];
                  }
                ];
              };
              
              offers: {
                Row: {
                  id: string;
                  org_id: string;
                  title: string;
                  status: string | null;
                  profile_type: string | null;
                  description: string | null;
                  city: string | null;
                  country: string | null;
                  is_remote: boolean | null;
                  remote_policy: "full_remote" | "hybrid" | "on_site" | null;
                  contract_type: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance" | null;
                  salary_min: number | null;
                  salary_max: number | null;
                  currency: string | null;
                  created_by: string | null;
                  responsible_user_id: string | null; // User responsable de l'offre (modifiable)
                  created_at: string;
                  updated_at: string | null;
                };
                Insert: {
                  id?: string;
                  org_id: string;
                  title: string;
                  status?: string | null;
                  profile_type?: string | null;
                  description?: string | null;
                  city?: string | null;
                  country?: string | null;
                  is_remote?: boolean | null;
                  remote_policy: "full_remote" | "hybrid" | "on_site" | null;
                  contract_type: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance" | null;
                  salary_min?: number | null;
                  salary_max?: number | null;
                  currency?: string | null;
              
                  created_by?: string | null;
                  responsible_user_id?: string | null; // User responsable de l'offre (modifiable)
                  created_at?: string;
                  updated_at?: string | null;
                };
                Update: Partial<{
                  id: string;
                  org_id: string;
                  title: string;
                  status: string | null;
                  profile_type: string | null;
                  description: string | null;
              
                  city: string | null;
                  country: string | null;
                  is_remote: boolean | null;
                  remote_policy: "full_remote" | "hybrid" | "on_site" | null;
                  contract_type: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance" | null;
                  salary_min: number | null;
                  salary_max: number | null;
                  currency: string | null;
              
                  created_by: string | null;
                  responsible_user_id: string | null; // User responsable de l'offre (modifiable)
                  created_at: string;
                  updated_at: string | null;
                }>;
                Relationships: [
                  {
                    foreignKeyName: "offers_org_id_fkey";
                    columns: ["org_id"];
                    referencedRelation: "organizations";
                    referencedColumns: ["id"];
                  }
                ];
              };              
        };

        Views: {
            [_ in never]: never;
        };

        Functions: {
            [_ in never]: never;
        };

        Enums: {
            [_ in never]: never;
        };

        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
