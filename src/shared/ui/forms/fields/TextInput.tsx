"use client";

import { Input } from "@/components/ui/input";
import { FormError } from "./FormError";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function TextInput({ label, error, className, ...rest }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <Input
        {...rest}
        className={className}
        aria-invalid={!!error}
      />
      <FormError message={error} />
    </div>
  );
}
