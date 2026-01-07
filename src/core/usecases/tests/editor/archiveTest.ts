// core/usecases/tests/makeArchiveTest.ts
import { z } from "zod";
import type { TestRepo } from "@/core/ports/TestRepo";

const ArchiveTestSchema = z.object({
  orgId: z.string().uuid(),
  testId: z.string().uuid(),
});

export type ArchiveTestInput = z.infer<typeof ArchiveTestSchema>;

export function makeArchiveTest(repo: TestRepo) {
  return async (raw: unknown) => {
    const input = ArchiveTestSchema.parse(raw);

    await repo.archiveById({
      orgId: input.orgId,
      testId: input.testId,
    });

    return { ok: true as const };
  };
}
