import { TestQuestion } from "./Test";

export type TestFlowItemKind = "video" | "test";

export interface TestFlow {
  id: string;
  orgId: string;
  offerId: string;
  createdAt: string;
  name: string;
  isActive: boolean;
  createdBy: string;
}

export type TestFlowItem = {
  id: string;
  orgId: string;
  flowId: string;
  orderIndex: number;
  kind: TestFlowItemKind;
  questions?: TestQuestion[];
  testId?: string;
  testName?: string;
  videoUrl?: string;
  title?: string | null;
  description?: string | null;
  isRequired?: boolean | null;
  createdAt?: string | null;
};
