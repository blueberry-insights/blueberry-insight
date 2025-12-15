import { getOfferTestFlowAction } from "./actions";
import { TestFlowReadOnly } from "@/features/tests/components/TestFlowReadOnly";

export default async function OfferTestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: offerId } = await params;

  const res = await getOfferTestFlowAction(offerId);

  if (!res.ok || !res.data) {
    return (
      <div className="p-6 text-muted-foreground">
        Aucun flow de tests configuré pour cette offre.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Parcours de tests</h2>

      <TestFlowReadOnly
        flow={res.data.flow}
        items={res.data.items}
      />
    </div>
  );
}
