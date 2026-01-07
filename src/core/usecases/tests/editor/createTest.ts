// src/core/usecases/tests/createTest.ts
import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1, "Le nom du questionnaire est obligatoire"),
  type: z.enum(["motivations", "scenario"]),
  description: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
});

export function makeCreateTest(testRepo: TestRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);

    // Tu peux mettre ici des règles métier si besoin (ex: limiter le nb de tests)

    const created = await testRepo.createTest({
      orgId: input.orgId,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      createdBy: input.createdBy,
      isActive: true,
    });

    return created;
  };
}
