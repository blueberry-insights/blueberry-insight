export interface Slugger {
  slugify(input: string): string;
  uniquify(base: string, exists: (slug: string)=>Promise<boolean>): Promise<string>;
}