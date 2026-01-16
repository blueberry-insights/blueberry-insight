// src/core/usecases/tests/updateQuestion.ts
import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";

const InputSchema = z.object({
  orgId: z.string().uuid(),
  questionId: z.string().uuid(),
  label: z.string().min(1, "Le libellé est obligatoire"),
  kind: z.enum(["yes_no", "scale", "choice", "long_text"]),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isReversed: z.boolean().optional().nullable(),
});

export function makeUpdateQuestion(testRepo: TestRepo) {
  return async (raw: unknown) => {
    const input = InputSchema.parse(raw);

    return testRepo.updateQuestion({
      orgId: input.orgId,
      questionId: input.questionId,
      label: input.label,
      kind: input.kind,
      minValue:
        input.kind === "scale" ? input.minValue ?? null : null,
      maxValue:
        input.kind === "scale" ? input.maxValue ?? null : null,
      options:
        input.kind === "choice" ? input.options ?? [] : null,
      isRequired: input.isRequired ?? true,
      isReversed: input.kind === "scale" ? (input.isReversed ?? null) : null,
    });
  };
}
