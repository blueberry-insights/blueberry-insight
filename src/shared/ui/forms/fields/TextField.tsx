"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type TextFieldProps = {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  withPasswordToggle?: boolean;
  disabled?: boolean;
};

export function TextField({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  withPasswordToggle = false,
  disabled = false,
}: TextFieldProps) {
  const [show, setShow] = useState(false);

  const isPassword = type === "password";
  const inputType = withPasswordToggle && isPassword && show ? "text" : type;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={withPasswordToggle && isPassword ? "pr-10" : undefined}
          disabled={disabled}
        />

        {withPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
