"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";
import type { BlueberryCatalogTest } from "@/core/models/Test";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/shared/hooks/useToast";
import {
  addFlowVideoItemAction,
  addFlowTestItemAction,
  deleteFlowItemAction,
} from "@/app/(app)/offers/[id]/tests/actions";

import { Trash2, Video, ClipboardList, Loader2 } from "lucide-react";

type Props = {
  offerId: string;
  flow: TestFlow;
  items: TestFlowItem[];
  tests: BlueberryCatalogTest[];
};

type AddMode = "video" | "test";

export function TestFlowEditor({ offerId, flow, items, tests }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  // source de vérité UI (évite “refresh obligatoire”)
  const [localItems, setLocalItems] = React.useState<TestFlowItem[]>(items);

  // resync si SSR change (ex: navigation)
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sorted = React.useMemo(
    () => [...localItems].sort((a, b) => a.orderIndex - b.orderIndex),
    [localItems]
  );

  const nextOrderIndex = (sorted.at(-1)?.orderIndex ?? 0) + 1;

  // panneau "ajouter un bloc"
  const [mode, setMode] = React.useState<AddMode>("video");
  const [pendingAdd, startAdd] = React.useTransition();
  const [, startDelete] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [selectedTestId, setSelectedTestId] = React.useState("");

  function resetAddForm() {
    setTitle("");
    setVideoUrl("");
    setSelectedTestId("");
  }

  function addVideo() {
    if (!videoUrl.trim()) {
      toast.error({ title: "URL manquante", description: "Renseigne une URL vidéo." });
      return;
    }

    startAdd(async () => {
      const fd = new FormData();
      fd.set("offerId", offerId);
      fd.set("flowId", flow.id);
      fd.set("orderIndex", String(nextOrderIndex));
      if (title.trim()) fd.set("title", title.trim());
      fd.set("videoUrl", videoUrl.trim());

      const res = await addFlowVideoItemAction(fd);
      if (!res.ok) {
        toast.error({ title: "Erreur", description: res.error });
        return;
      }

      // update immédiat UI
      setLocalItems((prev) => [...prev, res.data]);

      toast.success({
        title: "Bloc ajouté",
        description: "Vidéo ajoutée au parcours.",
      });

      resetAddForm();

      // backup : resync server (utile si d’autres champs sont calculés côté DB)
      router.refresh();
    });
  }

  function addTest() {
    if (!selectedTestId) {
      toast.error({ title: "Test manquant", description: "Choisis un test à ajouter." });
      return;
    }

    startAdd(async () => {
      const fd = new FormData();
      fd.set("offerId", offerId);
      fd.set("flowId", flow.id);
      fd.set("orderIndex", String(nextOrderIndex));
      if (title.trim()) fd.set("title", title.trim());
      fd.set("testId", selectedTestId);

      const res = await addFlowTestItemAction(fd);
      if (!res.ok) {
        toast.error({ title: "Erreur", description: res.error });
        return;
      }

      setLocalItems((prev) => [...prev, res.data]);

      const addedName = tests.find((t) => t.id === selectedTestId)?.name;
      toast.success({
        title: "Bloc ajouté",
        description: addedName ? `"${addedName}" ajouté au parcours.` : "Test ajouté au parcours.",
      });

      resetAddForm();
      router.refresh();
    });
  }

  function deleteItem(itemId: string) {
    startDelete(async () => {
      // optimistic
      const snapshot = localItems;
      setLocalItems((prev) => prev.filter((x) => x.id !== itemId));

      const fd = new FormData();
      fd.set("offerId", offerId);
      fd.set("itemId", itemId);

      const res = await deleteFlowItemAction(fd);
      if (!res.ok) {
        // rollback
        setLocalItems(snapshot);
        toast.error({ title: "Suppression impossible", description: res.error });
        return;
      }

      toast.success({ title: "Bloc supprimé", description: "Le bloc a été retiré du parcours." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* CANVAS */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Parcours</p>
            <p className="text-xs text-slate-500">
              Ordre exact de ce que verra le candidat (vidéos, tests, etc.)
            </p>
          </div>
          <Badge variant="secondary" className="text-[11px]">
            {sorted.length} bloc{sorted.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm font-medium text-slate-800">Aucun bloc pour le moment</p>
            <p className="mt-1 text-xs text-slate-500">
              Ajoute une vidéo d’intro, puis un test de motivations ou une mise en situation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((it, idx) => {
              const isVideo = it.kind === "video";

              const testName =
                !isVideo && it.testId
                  ? tests.find((t) => t.id === it.testId)?.name
                  : undefined;

              return (
                <div
                  key={it.id}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50/40 transition"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                      {isVideo ? (
                        <Video className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{idx + 1}.</span>
                        <Badge variant={isVideo ? "secondary" : "default"} className="text-[11px]">
                          {isVideo ? "Vidéo" : "Test"}
                        </Badge>
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {it.title?.trim()
                          ? it.title
                          : isVideo
                          ? "Vidéo"
                          : testName ?? "Test"}
                      </p>

                      <p className="text-xs text-slate-500 break-all">
                        {isVideo ? it.videoUrl ?? "—" : testName ? "Questionnaire" : it.testId ?? "—"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteItem(it.id)}
                    disabled={pendingAdd} // évite doubles actions en même temps
                    aria-label="Supprimer le bloc"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ajouter un bloc</p>
            <p className="text-xs text-slate-500">
              Ajoute un élément à la fin (on fera le reorder ensuite).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={mode === "video" ? "default" : "outline"}
              className="h-8 px-3 text-xs"
              onClick={() => setMode("video")}
              disabled={pendingAdd}
            >
              Vidéo
            </Button>
            <Button
              type="button"
              variant={mode === "test" ? "default" : "outline"}
              className="h-8 px-3 text-xs"
              onClick={() => setMode("test")}
              disabled={pendingAdd}
            >
              Test
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre (optionnel) — ex: Présentation du process"
            disabled={pendingAdd}
          />

          {mode === "video" ? (
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="URL vidéo (https://...)"
              disabled={pendingAdd}
            />
          ) : (
            <Select
              value={selectedTestId}
              onValueChange={(v) => setSelectedTestId(v)}
              disabled={pendingAdd}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un test" />
              </SelectTrigger>
              <SelectContent>
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetAddForm}
              disabled={pendingAdd}
            >
              Réinitialiser
            </Button>

            <Button
              type="button"
              onClick={mode === "video" ? addVideo : addTest}
              disabled={pendingAdd || (mode === "video" ? !videoUrl.trim() : !selectedTestId)}
            >
              {pendingAdd ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ajout...
                </span>
              ) : (
                "Ajouter au parcours"
              )}
            </Button>
          </div>

          <p className="text-[10px] text-slate-400">
            Ajout en fin de parcours (order_index = {nextOrderIndex}). Le drag & drop viendra après.
          </p>
        </div>
      </Card>
    </div>
  );
}
