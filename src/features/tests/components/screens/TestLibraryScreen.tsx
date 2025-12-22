// src/features/tests/screens/TestsScreen.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { Test } from "@/core/models/Test";
import { TestLibraryTable } from "../table/TestLibraryTable";
import { CreateTestModal } from "../modals/CreateTestModal";
import { UpdateTestModal } from "../modals/UpdateTestModal";
import { DeleteTestModal } from "../modals/DeleteTestModal";
import { useToast } from "@/shared/hooks/useToast";
import {
  duplicateTestAction,
} from "@/app/(app)/tests/action";

type Props = {
  orgId: string;
  initialTests: Test[];
};

export function TestLibraryScreen({ orgId, initialTests }: Props) {
  const [tests, setTests] = useState<Test[]>(initialTests);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [testToUpdate, setTestToUpdate] = useState<Test | null>(null);

  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [duplicatePending, startDuplicateTransition] = useTransition();
  const [deletePending] = useTransition();

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

  function handleOpenDelete(test: Test) {
    setTestToDelete(test);
    setDeleteModalOpen(true);
  }

  function handleCloseDelete() {
    if (deletePending) return;
    setDeleteModalOpen(false);
    setTestToDelete(null);
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
        onDeleteRequest={handleOpenDelete}
        deletePending={deletePending}
      />

      <CreateTestModal
        open={createModalOpen}
        onClose={handleCloseCreate}
        orgId={orgId}
        onCreated={handleCreated}
      />

      <UpdateTestModal
        open={updateModalOpen}
        onClose={handleCloseUpdate}
        onUpdated={handleTestUpdated}
        test={testToUpdate}
      />

      <DeleteTestModal
        open={deleteModalOpen}
        test={testToDelete}
        isSubmitting={deletePending}
        onClose={handleCloseDelete}
        onDeleted={(id: string) => {
          setTests((prev) => prev.filter((t) => t.id !== id));
          setDeleteModalOpen(false);
          setTestToDelete(null);
        }}
      />
    </div>
  );
}
