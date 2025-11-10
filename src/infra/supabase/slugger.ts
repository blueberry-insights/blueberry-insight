import type { Slugger } from "@/core/ports/Slugger";
export const DefaultSlugger: Slugger = {
  slugify(input) {
    return input.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 60) || "org";
  },
  async uniquify(base, exists) {
    let candidate = base;
    let i = 1;
    while (await exists(candidate)) {
      i += 1;
      candidate = `${base}-${i}`;
    }
    return candidate;
  },
};
