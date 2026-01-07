// app/(app)/_components/OrgSwitcher.client.tsx
"use client";

import { setActiveOrgAction } from "@/app/(app)/_actions";

type Org = {
  id: string;
  name: string;
  role: string;
};

export function OrgSwitcherClient({
  orgs,
  activeOrgId,
}: {
  orgs: Org[];
  activeOrgId?: string;
}) {
  return (
    <select
      value={activeOrgId}
      onChange={(e) => setActiveOrgAction(e.target.value)}
      className="border rounded px-2 py-1 text-sm"
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.role})
        </option>
      ))}
    </select>
  );
}
