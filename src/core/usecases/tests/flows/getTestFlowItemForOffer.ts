// core/usecases/tests/getTestFlowItemForOffer.ts
import type { TestFlowItem } from "@/core/models/TestFlow";
import type { TestFlowRepo } from "@/core/ports/TestFlowRepo";

export type TestFlowItemInfo = {
  flowItem: TestFlowItem;
  flowName: string;
  itemIndex: number;
  totalItems: number;
};

export function makeGetTestFlowItemForOffer(deps: {
  flowRepo: TestFlowRepo;
}) {
  const { flowRepo } = deps;

  return async function getTestFlowItemForOffer(input: {
    orgId: string;
    offerId: string;
    testId: string;
  }): Promise<TestFlowItemInfo | null> {
    const { orgId, offerId, testId } = input;

    // Récupérer le flow pour cette offre
    const flowData = await flowRepo.getFlowByOffer({
      orgId,
      offerId,
    });

    if (!flowData) {
      return null;
    }

    // Trouver l'item qui correspond au testId
    const flowItem = flowData.items.find(
      (item) => item.kind === "test" && item.testId === testId
    );

    if (!flowItem) {
      return null;
    }

    const itemIndex = flowData.items.findIndex((item) => item.id === flowItem.id);

    return {
      flowItem,
      flowName: flowData.flow.name,
      itemIndex: itemIndex + 1, // 1-based
      totalItems: flowData.items.length,
    };
  };
}

