// src/features/tests/table/TestTableRow.tsx
import Link from "next/link";
import type { Test } from "@/core/models/Test";
import { TestLibraryTableActions } from "./TestLibraryTableActions";

type Props = {
  test: Test;
  onUpdateRequest?: (test: Test) => void;
  onArchiveRequest?: (test: Test) => void;
  onDuplicateRequest?: (test: Test) => void;
  duplicatePending?: boolean;
  archivePending?: boolean;
};

export function TestLibraryTableRow({ test, onUpdateRequest, onDuplicateRequest, duplicatePending, onArchiveRequest, archivePending }: Props) {
  const createdDate = test.createdAt
    ? new Date(test.createdAt).toLocaleDateString("fr-FR")
    : "-";

  const typeLabel =
    test.type === "motivations" ? "Motivations" : "Mise en situation";

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2 align-middle">
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/tests/${test.id}`}
            className="text-sm font-medium text-slate-800 hover:underline"
          >
            {test.name}
          </Link>
          {test.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {test.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-2 align-middle text-xs text-slate-600">
        {typeLabel}
      </td>
      <td className="px-4 py-2 align-middle">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            test.isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-slate-50 text-slate-500 border border-slate-200"
          }`}
        >
          {test.isActive ? "Actif" : "Archivé"}
        </span>
      </td>
      <td className="px-4 py-2 align-middle text-xs text-slate-600">
        {createdDate}
      </td>
      <TestLibraryTableActions
        test={test}
        onUpdateRequest={onUpdateRequest}
        onDuplicateRequest={onDuplicateRequest}
        duplicatePending={duplicatePending}
        onArchiveRequest={onArchiveRequest}
        archivePending={archivePending}
      />
    </tr>
  );
}
