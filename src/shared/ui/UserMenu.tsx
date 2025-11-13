"use client";

type Props = {
  displayName: string;
  orgName?: string;
  avatarUrl?: string | null;
  collapsed?: boolean;
  size?: "sm" | "md";      // 👈 header vs sidebar
  className?: string;
};

export function UserMenu({
  displayName,
  orgName,
  avatarUrl,
  collapsed,
  size = "md",
  className = "",
}: Props) {
  const initials =
    displayName?.split(" ").map(n => n[0]?.toUpperCase()).join("").slice(0, 2) || "?";

  const isSm = size === "sm";
  const avatarSize = isSm ? 32 : 64;
  const nameSize = isSm ? "text-sm" : "text-base";
  const orgSize = isSm ? "text-[11px]" : "text-xs";
  const spacing = isSm ? "gap-2" : "gap-3";

  return (
    <div className={`flex items-center ${spacing} ${className}`}>
      {/* Avatar */}
      <div
        className="overflow-hidden rounded-full border border-border bg-muted grid place-items-center text-primary font-semibold shrink-0"
        style={{ width: avatarSize, height: avatarSize, fontSize: isSm ? 12 : 16 }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Infos texte */}
      <div className="flex flex-col leading-tight min-w-0">
        <div className={`${nameSize} font-medium truncate max-w-[140px]`}>
          {displayName}
        </div>
        {orgName && (
          <div className={`${orgSize} text-muted-foreground truncate max-w-[140px]`}>
            {orgName}
          </div>
        )}
      </div>
    </div>
  );
}
