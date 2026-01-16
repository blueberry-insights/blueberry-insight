// src/features/tests/screens/TestsScreen.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { Test } from "@/core/models/Test";
import { TestLibraryTable } from "../table/TestLibraryTable";
import { CreateTestModal } from "../modals/CreateTestModal";
import { UpdateTestModal } from "../modals/UpdateTestModal";
import { ArchiveTestModal } from "../modals/ArchiveTestModal";
import { useToast } from "@/shared/hooks/useToast";
import {
  duplicateTestAction,
  archiveTestAction,
} from "@/app/(app)/tests/action";
type TargetOrg = { id: string; name: string; slug: string };

type Props = {
  orgId: string;
  initialTests: Test[];
  targetOrgs: TargetOrg[];
};

export function TestLibraryScreen({ orgId, initialTests, targetOrgs }: Props) {
  const [tests, setTests] = useState<Test[]>(initialTests);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [testToUpdate, setTestToUpdate] = useState<Test | null>(null);

  const [testToArchive, setTestToArchive] = useState<Test | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [duplicatePending, startDuplicateTransition] = useTransition();
  const [archivePending, startArchiveTransition] = useTransition();

  const { toast } = useToast();

  // --- CREATE ---
  function handleOpenCreate() {
    setCreateModalOpen(true);
  }

  function handleCloseCreate() {
    setCreateModalOpen(false);
  }

  function handleCreated(newTest: Test) {
    setTests((prev) => [newTest, ...prev]);
    setCreateModalOpen(false);
  }

  // --- UPDATE ---
  function handleOpenUpdate(test: Test) {
    setTestToUpdate(test);
    setUpdateModalOpen(true);
  }

  function handleCloseUpdate() {
    setUpdateModalOpen(false);
    setTestToUpdate(null);
  }

  function handleTestUpdated(updated: Test) {
    setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setUpdateModalOpen(false);
    setTestToUpdate(null);
  }

  // --- DUPLICATE ---
  function handleDuplicateRequest(test: Test) {
    startDuplicateTransition(async () => {
      const form = new FormData();
      form.set("testId", test.id);

      const res = await duplicateTestAction(form);

      if (!res.ok) {
        toast.error({
          title: "Erreur lors de la duplication du test",
          description:
            res.error ?? "Impossible de dupliquer ce test pour le moment.",
        });
        return;
      }

      const duplicated = res.data as Test;

      setTests((prev) => [duplicated, ...prev]);

      toast.success({
        title: "Test dupliqué",
        description: `"${duplicated.name}" a été dupliqué avec succès.`,
      });
    });
  }

  function handleOpenArchive(test: Test) {
    setTestToArchive(test);
    setArchiveModalOpen(true);
  }

  function handleCloseArchive() {
    if (archivePending) return;
    setArchiveModalOpen(false);
    setTestToArchive(null);
  }

  function handleConfirmArchive() {
    if (!testToArchive) return;

    startArchiveTransition(async () => {
      const form = new FormData();
      form.set("testId", testToArchive.id);

      const res = await archiveTestAction(form);

      if (!res.ok) {
        toast.error({
          title: "Erreur d'archivage",
          description: res.error ?? "Erreur lors de l'archivage du test",
        });
        handleCloseArchive();
        return;
      }

      setTests((prev) => prev.filter((t) => t.id !== testToArchive.id));

      toast.success({
        title: "Test archivé",
        description: `"${testToArchive.name}" a été archivé.`,
      });

      handleCloseArchive();
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Tests</h1>
          <p className="text-sm text-muted-foreground">
            Bibliothèque de questionnaires et mises en situation de ton
            organisation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Créer un test
        </button>
      </div>

      <TestLibraryTable
        tests={tests}
        onUpdateRequest={handleOpenUpdate}
        onDuplicateRequest={handleDuplicateRequest}
        duplicatePending={duplicatePending}
        onArchiveRequest={handleOpenArchive}
        archivePending={archivePending}
      />

      <CreateTestModal
        key={`create-test-modal-${createModalOpen}`}
        open={createModalOpen}
        onClose={handleCloseCreate}
        orgId={orgId}
        onCreated={handleCreated}
        targetOrgs={targetOrgs ?? []}
      />

      <UpdateTestModal
      key={`update-test-${testToUpdate?.id ?? "none"}-${updateModalOpen ? "open" : "closed"}`}
        open={updateModalOpen}
        onClose={handleCloseUpdate}
        onUpdated={handleTestUpdated}
        test={testToUpdate}
        targetOrgs={targetOrgs ?? []}
      />

      <ArchiveTestModal
        open={archiveModalOpen}
        test={testToArchive}
        isSubmitting={archivePending}
        onClose={handleCloseArchive}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
