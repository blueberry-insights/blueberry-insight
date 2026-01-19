
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
  // Ces champs sont optionnels - s'ils ne sont pas fournis, ils seront générés automatiquement
  businessCode: z.string().optional().nullable(),
  dimensionCode: z.string().optional().nullable(),
  dimensionOrder: z.number().int().optional().nullable(),
  isReversed: z.boolean().optional().nullable(),
  context: z.string().optional().nullable(),
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
      businessCode: input.businessCode ?? undefined,
      dimensionCode: input.dimensionCode ?? undefined,
      dimensionOrder: input.dimensionOrder ?? undefined,
      isReversed: input.isReversed ?? undefined,
      context: input.context ?? undefined,
    };

    const created = await testRepo.addQuestion(payload);

    return created;
  };
}
