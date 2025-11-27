import type { ReactNode } from "react";

type DetailTwoColumnLayoutProps = {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
};

export function DetailTwoColumnLayout({
  leftColumn,
  rightColumn,
}: DetailTwoColumnLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-4">{leftColumn}</div>
      <aside className="space-y-4">{rightColumn}</aside>
    </div>
  );
}
