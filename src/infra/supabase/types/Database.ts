
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
                    role: "owner" | "member";
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    org_id: string;
                    role?: "owner" | "member";
                    created_at?: string;
                };
                Update: Partial<{
                    user_id: string;
                    org_id: string;
                    role: "owner" | "member";
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

            candidates: {
                Row: {
                    id: string;
                    org_id: string;
                    full_name: string;
                    email: string | null;
                    source: string | null;
                    notes: string | null;
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
                    | null;
                    cv_path: string | null;
                    cv_original_name: string | null;
                    cv_mime_type: string | null;
                    cv_size_bytes: number | null;
                    cv_uploaded_at: string | null;

                    tags: string[] | null; // ou text[] selon ton SQL
                    note: string | null;

                };
                Insert: {
                    id?: string;
                    org_id: string;
                    full_name: string;
                    email?: string | null;
                    source?: string | null;
                    status?: string | null;
                    notes?: string | null;
                    offer_id?: string | null;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: Partial<{
                    id: string;
                    org_id: string;
                    full_name: string;
                    email: string | null;
                    source: string | null;
                    status: string | null;
                    notes: string | null;
                    offer_id: string | null;
                    created_at: string;
                    updated_at: string | null;
                }>;
                Relationships: [
                    {
                        foreignKeyName: "candidates_org_id_fkey";
                        columns: ["org_id"];
                        referencedRelation: "organizations";
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
                    created_at: string;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    title: string;
                    status?: string | null;
                    created_at?: string;
                    updated_at?: string | null;
                };
                Update: Partial<{
                    id: string;
                    org_id: string;
                    title: string;
                    status: string | null;
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
