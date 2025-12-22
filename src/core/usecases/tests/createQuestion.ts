
import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";
import type { CreateQuestionInput } from "@/core/models/Test";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  testId: z.string().uuid(),
  label: z.string().min(1, "Le libellé de la question est obligatoire"),
  kind: z.enum(["yes_no", "scale", "choice", "long_text"]),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

export function makeCreateQuestion(testRepo: TestRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);

    const payload: CreateQuestionInput = {
      orgId: input.orgId,
      testId: input.testId,
      label: input.label,
      kind: input.kind,
      minValue: input.minValue,
      maxValue: input.maxValue,
      options: input.options,
      isRequired: input.isRequired ?? true,
      orderIndex: input.orderIndex, 
    };

    const created = await testRepo.addQuestion(payload);

    return created;
  };
}
