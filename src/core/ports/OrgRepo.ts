export interface Org {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
}
export interface OrgRepo {
  findBySlug(slug: string): Promise<Org | null>;
  create(name: string, slug: string, createdBy: string): Promise<Org>;
}
