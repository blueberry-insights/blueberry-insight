import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";

export type CreateTestFlowInput = {
  orgId: string;
  offerId: string;
  name?: string;
  createdBy: string 
};

export type AddFlowItemInput =
  | {
      orgId: string;
      flowId: string;
      orderIndex: number;
      kind: "video";
      title?: string;
      description?: string;
      videoUrl?: string; // Optionnel pour permettre draft
      isRequired?: boolean;
    }
  | {
      orgId: string;
      flowId: string;
      orderIndex: number;
      kind: "test";
      title?: string;
      description?: string;
      testId: string;
      isRequired?: boolean;
    };

export type ReorderFlowItemsInput = {
  orgId: string;
  flowId: string;
  // ex: [{id, orderIndex}]
  items: Array<{ id: string; orderIndex: number }>;
};

export interface TestFlowRepo {
  getFlowByOffer(input: {
    orgId: string;
    offerId: string;
  }): Promise<{ flow: TestFlow; items: TestFlowItem[] } | null>;

  createFlow(input: {
    orgId: string;
    offerId: string;
    name: string;
    isActive: boolean;
    createdBy: string;
  }): Promise<TestFlow>;
  addItem(input: AddFlowItemInput): Promise<TestFlowItem>;
  reorderItems(input: ReorderFlowItemsInput): Promise<void>;
  deleteItem(input: { orgId: string; itemId: string }): Promise<void>;
  countItemsUsingTest(testId: string, orgId: string): Promise<number>;

}
