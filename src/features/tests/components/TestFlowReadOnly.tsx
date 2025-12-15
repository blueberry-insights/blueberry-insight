// src/features/tests/components/TestFlowReadOnly.tsx
import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestQuestion } from "@/core/models/Test";

type Props = {
  items: TestFlowItem[];
  flow: TestFlow;
};

export function TestFlowReadOnly({ items, flow }: Props) {
  if (items.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Aucun élément dans le parcours de test pour cette offre.
      </Card>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-3">
      {sortedItems.map((item, index) => (
        <Card key={item.id} className="p-4 flex items-start gap-4">
          {/* Ordre */}
          <div className="text-sm text-muted-foreground pt-1">{index + 1}.</div>

          {/* Contenu */}
          <div className="flex-1 space-y-2">
            {item.kind === "video" ? (
              <>
                <Badge variant="secondary">Vidéo</Badge>

                <div className="text-sm font-medium">
                  {item.title || "Vidéo de présentation"}
                </div>

                {item.videoUrl ? (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline break-all text-muted-foreground"
                  >
                    {item.videoUrl}
                  </a>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Aucune URL renseignée
                  </div>
                )}
              </>
            ) : (
              <>
                <Badge>Test</Badge>

                <div className="text-sm font-medium">
                  {item.testName || item.title || "Test"}
                </div>

                {item.isRequired && (
                  <div className="text-xs text-muted-foreground">
                    Obligatoire
                  </div>
                )}
                {item.kind === "test" &&
                  item.questions &&
                  item.questions.length > 0 && (
                    <div className="mt-2 space-y-2 pl-4 border-l">
                      {(item.questions).map((q: TestQuestion, qIndex: number) => (
                        <div key={q.id} className="text-sm">
                          <div className="font-medium">
                            {qIndex + 1}. {q.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Type : {q.kind}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </>
            )}

            {flow.name && (
              <div className="text-xs text-muted-foreground">
                Parcours : {flow.name}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
