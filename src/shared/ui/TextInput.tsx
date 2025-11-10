"use client";
import { FormError } from "@/shared/ui/FormError";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};
export function TextInput({ label, error, className, ...rest }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        {...rest}
        className={`w-full rounded-lg border p-2 ${className ?? ""} ${error ? "border-red-500" : ""}`}
        aria-invalid={!!error}
      />
      <FormError message={error} />
    </div>
  );
}
