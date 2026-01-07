// src/features/tests/table/TestTable.tsx
import type { Test } from "@/core/models/Test";
import { TestLibraryTableRow } from "./TestLibraryTableRow";

type Props = {
  tests: Test[];
  onUpdateRequest?: (test: Test) => void;
  onArchiveRequest?: (test: Test) => void;
  onDuplicateRequest?: (test: Test) => void;
  duplicatePending?: boolean;
  archivePending?: boolean;
};

export function TestLibraryTable({
  tests,
  onUpdateRequest,
  onDuplicateRequest,
  onArchiveRequest,
  archivePending,
}: Props) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-slate-600 bg-[rgba(139,151,255,0.08)]">
          <tr>
            <th className="text-left px-4 py-3">Nom du test</th>
            <th className="text-left px-4 py-3">Type</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="text-left px-4 py-3">Créé le</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {tests.map((test) => (
            <TestLibraryTableRow
              key={test.id}
              test={test}
              onUpdateRequest={onUpdateRequest}
              onArchiveRequest={onArchiveRequest}
              onDuplicateRequest={onDuplicateRequest}
              archivePending={archivePending}
            />
          ))}

          {tests.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-sm text-slate-500 bg-slate-50"
              >
                Aucun test pour le moment.
                <span className="block text-[11px] text-slate-400 mt-1">
                  Clique sur &laquo; Créer un test &raquo; pour commencer à
                  paramétrer ta bibliothèque.
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
