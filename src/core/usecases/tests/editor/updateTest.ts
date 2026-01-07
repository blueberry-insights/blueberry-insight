
import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  testId: z.string().uuid(),      
  name: z.string().min(1, "Le nom du questionnaire est obligatoire"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export function makeUpdateTest(testRepo: TestRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);

    const updated = await testRepo.updateTest({
      id: input.testId,           
      orgId: input.orgId,
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive,      
    });

    return updated;
  };
}
