// src/shared/ui/GenericForm.tsx
"use client";

import * as React from "react";

type GenericFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "encType" | "method"> & {
  action?: ((formData: FormData) => unknown | Promise<unknown>) | string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
  className?: string;
  encType?: "application/x-www-form-urlencoded" | "multipart/form-data";
};

export function GenericForm({
  action,
  onSubmit,
  children,
  className,
  encType,
  ...rest
}: GenericFormProps) {
  const formAction = action as React.ComponentProps<"form">["action"];
  const isFunctionAction = typeof action === "function";

  // React gère automatiquement encType et method pour les Server Actions (fonctions)
  // On ne les passe que si action est une string (URL classique)
  const formProps: React.FormHTMLAttributes<HTMLFormElement> = {
    action: formAction,
    onSubmit,
    className,
    ...rest,
  };

  if (!isFunctionAction && encType) {
    formProps.encType = encType;
  }

  return <form {...formProps}>{children}</form>;
}
