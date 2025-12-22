// features/tests/components/OfferTestsScreen.tsx
"use client";

import { useTransition } from "react";
import type { Test } from "@/core/models/Test";
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow"; // ou le type retourné par ton usecase
import { TestFlowEditor } from "../TestFlowEditor";
import { GenericForm } from "@/shared/ui";
import { FormSubmit } from "@/shared/ui/forms";
import { createFlowForOfferAction } from "@/app/(app)/offers/[id]/tests/actions";
import { useToast } from "@/shared/hooks/useToast";

type Props = {
  offerId: string;
  flowData: TestFlow | null;
  items: TestFlowItem[];
  tests: Test[];
};

export function TestOfferScreen({ offerId, flowData, items, tests }: Props) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Si pas encore de flow → empty state + CTA
  if (!flowData) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Parcours de tests</h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Aucun parcours de tests n&apos;est encore configuré pour cette offre.
          C&apos;est ici que tu vas définir ce que le candidat verra après avoir postulé :
          vidéos d&apos;introduction, test de motivations, mises en situation…
        </p>

        <GenericForm
          id="create-offer-flow-form"
          action={async (formData) => {
            startTransition(async () => {
              const res = await createFlowForOfferAction(formData);
              if (!res.ok) {
                toast.error({
                  title: "Erreur",
                  description: res.error,
                });
                return;
              }
              // Next router.refresh sera déclenché par revalidatePath côté serveur
            });
          }}
          className="mt-4"
        >
          <input type="hidden" name="offerId" value={offerId} />
          <FormSubmit pendingOverride={pending}>
            {pending ? "Création du parcours..." : "Créer le parcours de tests"}
          </FormSubmit>
        </GenericForm>
      </div>
    );
  }

  // Si flow existant → on réutilise ton éditeur
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Parcours de tests</h2>
      <p className="text-sm text-muted-foreground max-w-xl">
        Voici l&apos;enchaînement que verront les candidats pour cette offre.
        Tu peux ajouter des vidéos d’intro, des questionnaires et ajuster l’ordre.
      </p>

      <TestFlowEditor
        offerId={offerId}
        flow={flowData}
        items={items}
        tests={tests}
      />
    </div>
  );
}
