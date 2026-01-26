"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import type { TestFlow, TestFlowItem } from "@/core/models/TestFlow";
import type { BlueberryCatalogTest } from "@/core/models/Test";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
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
  requestFlowVideoUploadAction,
  attachUploadedVideoToFlowItemAction,
} from "@/app/(app)/offers/[id]/tests/actions";

import { Trash2, Video, ClipboardList, Loader2, Upload } from "lucide-react";

type Props = {
  offerId: string;
  flow: TestFlow;
  items: TestFlowItem[];
  tests: BlueberryCatalogTest[];
};

type AddMode = "video" | "test";

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ Secure: publishable/anon est fait pour être exposé côté client.
  // On garde la session pour que les policies Storage s’appliquent correctement.
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function TestFlowEditor({ offerId, flow, items, tests }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [localItems, setLocalItems] = React.useState<TestFlowItem[]>(items);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sorted = React.useMemo(
    () => [...localItems].sort((a, b) => a.orderIndex - b.orderIndex),
    [localItems]
  );

  const nextOrderIndex = (sorted.at(-1)?.orderIndex ?? 0) + 1;

  const [mode, setMode] = React.useState<AddMode>("video");
  const [pendingAdd, startAdd] = React.useTransition();
  const [, startDelete] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [selectedTestId, setSelectedTestId] = React.useState("");

  const [uploadingItemId, setUploadingItemId] = React.useState<string | null>(
    null
  );
  const fileInputsRef = React.useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  function resetAddForm() {
    setTitle("");
    setVideoUrl("");
    setSelectedTestId("");
  }

  function addVideo() {
    // ✅ CORRECT: URL optionnelle (bloc vidéo “draft” autorisé)
    startAdd(async () => {
      const fd = new FormData();
      fd.set("offerId", offerId);
      fd.set("flowId", flow.id);
      fd.set("orderIndex", String(nextOrderIndex));
      if (title.trim()) fd.set("title", title.trim());
      if (videoUrl.trim()) fd.set("videoUrl", videoUrl.trim()); // optionnel

      const res = await addFlowVideoItemAction(fd);
      if (!res.ok) {
        toast.error({ title: "Erreur", description: res.error });
        return;
      }

      setLocalItems((prev) => [...prev, res.data]);

      toast.success({
        title: "Bloc ajouté",
        description: videoUrl.trim()
          ? "Vidéo ajoutée au parcours (URL externe)."
          : "Bloc vidéo ajouté. Tu peux maintenant uploader un fichier.",
      });

      resetAddForm();
      router.refresh();
    });
  }

  function addTest() {
    if (!selectedTestId) {
      toast.error({
        title: "Test manquant",
        description: "Choisis un test à ajouter.",
      });
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
        description: addedName
          ? `"${addedName}" ajouté au parcours.`
          : "Test ajouté au parcours.",
      });

      resetAddForm();
      router.refresh();
    });
  }

  function deleteItem(itemId: string) {
    startDelete(async () => {
      const snapshot = localItems;
      setLocalItems((prev) => prev.filter((x) => x.id !== itemId));

      const fd = new FormData();
      fd.set("offerId", offerId);
      fd.set("itemId", itemId);

      const res = await deleteFlowItemAction(fd);
      if (!res.ok) {
        setLocalItems(snapshot);
        toast.error({ title: "Suppression impossible", description: res.error });
        return;
      }

      toast.success({
        title: "Bloc supprimé",
        description: "Le bloc a été retiré du parcours.",
      });
      router.refresh();
    });
  }

  function triggerUpload(itemId: string) {
    fileInputsRef.current[itemId]?.click();
  }

  async function handleFileSelected(item: TestFlowItem, file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error({
        title: "Fichier invalide",
        description: "Choisis une vidéo.",
      });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error({
        title: "Vidéo trop lourde",
        description: "200MB max.",
      });
      return;
    }

    setUploadingItemId(item.id);

    try {
      // 1) signed upload (server)
      const fdReq = new FormData();
      fdReq.set("offerId", offerId);
      fdReq.set("itemId", item.id);
      fdReq.set("fileName", file.name);
      fdReq.set("mimeType", file.type);
      fdReq.set("sizeBytes", String(file.size));

      const signed = await requestFlowVideoUploadAction(fdReq);
      if (!signed.ok) {
        toast.error({ title: "Erreur", description: signed.error });
        return;
      }

      // 2) upload direct storage (client)
      const sb = getSupabaseBrowserClient();
      const { bucket, path, token } = signed.data;

      const { error: upErr } = await sb.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });

      if (upErr) {
        console.error("[uploadToSignedUrl] error", upErr);
        toast.error({
          title: "Upload échoué",
          description: "Erreur storage.",
        });
        return;
      }

      // 3) attach (server)
      const fdAttach = new FormData();
      fdAttach.set("offerId", offerId);
      fdAttach.set("itemId", item.id);
      fdAttach.set("storagePath", path);
      fdAttach.set("mimeType", file.type);
      fdAttach.set("sizeBytes", String(file.size));
      if (item.title?.trim()) fdAttach.set("title", item.title.trim());

      const attached = await attachUploadedVideoToFlowItemAction(fdAttach);
      if (!attached.ok) {
        toast.error({ title: "Erreur", description: attached.error });
        return;
      }

      setLocalItems((prev) =>
        prev.map((x) => (x.id === item.id ? attached.data : x))
      );

      toast.success({
        title: "Vidéo uploadée",
        description: "La vidéo est attachée au bloc.",
      });

      router.refresh();
    } catch (e) {
      console.error("[handleFileSelected]", e);
      toast.error({
        title: "Erreur",
        description: "Erreur pendant l’upload.",
      });
    } finally {
      setUploadingItemId(null);
      const input = fileInputsRef.current[item.id];
      if (input) input.value = "";
    }
  }

  return (
    <div className="space-y-4">
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
            <p className="text-sm font-medium text-slate-800">
              Aucun bloc pour le moment
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ajoute une vidéo d’intro, puis un test.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((it, idx) => {
              const isVideo = it.kind === "video";
              const isUploading = uploadingItemId === it.id;

              const testName =
                !isVideo && it.testId
                  ? tests.find((t) => t.id === it.testId)?.name
                  : undefined;

              // ⚠️ Tant que le mapping repo n’est pas clean, on fallback sur any
              const videoAssetId = it.videoAssetId;

              const isComplete =
                // fallback “logique”
                (!isVideo || Boolean(it.videoUrl?.trim()) || Boolean(videoAssetId));

              const hasExternalUrl = Boolean(it.videoUrl?.trim());
              const hasUploadedVideo = Boolean(videoAssetId);

              const badgeVariant = !isVideo
                ? "default"
                : isComplete
                ? "secondary"
                : "outline"; // "outline" pour draft au lieu de "destructive"

              const badgeLabel = !isVideo
                ? "Test"
                : isComplete
                ? hasUploadedVideo
                  ? "Upload (storage)"
                  : hasExternalUrl
                  ? "URL externe"
                  : "OK"
                : "Brouillon"; // "Brouillon" au lieu de "À compléter"

              return (
                <div
                  key={it.id}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50/40 transition"
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                      {isVideo ? (
                        <Video className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          {idx + 1}.
                        </span>

                        <Badge
                          variant={isVideo ? "secondary" : "default"}
                          className="text-[11px]"
                        >
                          {isVideo ? "Vidéo" : "Test"}
                        </Badge>

                        {isVideo && (
                          <Badge
                            variant={badgeVariant as VariantProps<typeof badgeVariants>["variant"]}
                            className="text-[11px]"
                          >
                            {badgeLabel}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {it.title?.trim()
                          ? it.title
                          : isVideo
                          ? "Vidéo"
                          : testName ?? "Test"}
                      </p>

                      <p className="text-xs text-slate-500 break-all">
                        {isVideo
                          ? hasUploadedVideo
                            ? "Vidéo uploadée (storage Blueberry)"
                            : hasExternalUrl
                            ? it.videoUrl
                            : "Aucune vidéo pour l’instant"
                          : testName
                          ? "Questionnaire"
                          : it.testId ?? "—"}
                      </p>

                      {isVideo && (
                        <input
                          ref={(el) => {
                            fileInputsRef.current[it.id] = el;
                          }}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileSelected(it, e.target.files?.[0] ?? null)
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isVideo && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        onClick={() => triggerUpload(it.id)}
                        disabled={pendingAdd || isUploading}
                      >
                        {isUploading ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Upload...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Uploader
                          </span>
                        )}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteItem(it.id)}
                      disabled={pendingAdd || isUploading}
                      aria-label="Supprimer le bloc"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            <p className="text-xs text-slate-500">Ajoute un élément à la fin.</p>
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
            <>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="URL vidéo externe (optionnel) — sinon upload dans le bloc"
                disabled={pendingAdd}
              />
              <p className="text-[11px] text-slate-500">
                Tu peux créer le bloc sans URL, puis cliquer “Uploader”.
              </p>
            </>
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
              disabled={pendingAdd || (mode === "test" ? !selectedTestId : false)}
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
            Ajout en fin de parcours (order_index = {nextOrderIndex}).
          </p>
        </div>
      </Card>
    </div>
  );
}
