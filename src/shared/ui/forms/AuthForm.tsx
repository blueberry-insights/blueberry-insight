// src/shared/ui/AuthForm.tsx
"use client";

import * as React from "react";

type AuthFormProps = {
  action?: React.ComponentProps<"form">["action"];
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
  className?: string;
};

export function AuthForm({
  action,
  onSubmit,
  children,
  className,
}: AuthFormProps) {
  return (
    <form
      action={action}
      onSubmit={onSubmit}
      className={[
        "w-full max-w-md rounded-2xl border border-white/30",
        "bg-[rgba(255,255,255,0.4)] backdrop-blur p-8 space-y-4",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </form>
  );
}
