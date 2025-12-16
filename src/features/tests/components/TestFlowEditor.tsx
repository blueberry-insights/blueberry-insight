"use client";

import * as React from "react";
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Test } from "@/core/models/Test";
import {
  addFlowVideoItemAction,
  addFlowTestItemAction,
  deleteFlowItemAction,
} from "@/app/(app)/offers/[id]/tests/actions";
import { GenericForm } from "@/shared/ui";

type Props = {
  offerId: string;
  flow: TestFlow;
  items: TestFlowItem[];
  tests: Test[];
};

export function TestFlowEditor({ offerId, flow, items, tests }: Props) {
  const [selectedTestId, setSelectedTestId] = React.useState("");
  const sorted = React.useMemo(
    () => [...items].sort((a, b) => a.orderIndex - b.orderIndex),
    [items]
  );

  const nextOrderIndex = (sorted.at(-1)?.orderIndex ?? 0) + 1;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="font-medium">Ajouter un bloc vidéo</div>

        <GenericForm
          id="add-flow-video-item-form"
          action={addFlowVideoItemAction}
          className="grid gap-2"
        >
          <Input type="hidden" name="offerId" value={offerId} />
          <Input type="hidden" name="flowId" value={flow.id} />
          <Input type="hidden" name="orderIndex" value={nextOrderIndex} />

          <Input
            name="title"
            placeholder="Titre (ex: Présentation du process)"
          />
          <Input
            name="videoUrl"
            placeholder="URL vidéo (https://...)"
            required
          />

          <div>
            <Button type="submit">Ajouter la vidéo</Button>
          </div>
        </GenericForm>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Ajouter un bloc test</div>

        <GenericForm
          id="add-flow-test-item-form"
          action={addFlowTestItemAction}
          className="grid gap-2"
        >
          <Input type="hidden" name="offerId" value={offerId} />
          <Input type="hidden" name="flowId" value={flow.id} />
          <Input type="hidden" name="orderIndex" value={nextOrderIndex} />

          <Input name="title" placeholder="Titre (optionnel)" />
          <Select
            value={selectedTestId}
            onValueChange={(value) => setSelectedTestId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un test" />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <Button type="submit">Ajouter le test</Button>
          </div>
        </GenericForm>
      </Card>

      {/* LIST + DELETE */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Blocs du parcours</div>

        {sorted.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucun élément.</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((it, idx) => (
              <div
                key={it.id}
                className="flex items-start justify-between gap-3 border rounded-lg p-3"
              >
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {idx + 1}.
                  </div>

                  {it.kind === "video" ? (
                    <>
                      <Badge variant="secondary">Vidéo</Badge>
                      <div className="text-sm font-medium">
                        {it.title ?? "Vidéo"}
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        {it.videoUrl ?? "—"}
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge>Test</Badge>
                      <div className="text-sm font-medium">
                        {it.testName ?? it.title ?? "Test"}
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        {it.testId ?? "—"}
                      </div>
                    </>
                  )}
                </div>

                <GenericForm
                  id="delete-flow-item-form"
                  action={deleteFlowItemAction}
                >
                  <input type="hidden" name="offerId" value={offerId} />
                  <input type="hidden" name="itemId" value={it.id} />
                  <Button type="submit" variant="destructive">
                    Supprimer
                  </Button>
                </GenericForm>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
