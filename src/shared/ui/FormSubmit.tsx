"use client";
import { useFormStatus } from "react-dom";

export function FormSubmit({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`relative w-full rounded-lg bg-[#8B97FF] text-white py-2 font-medium transition-all
              ${pending ? "opacity-70 cursor-wait" : "hover:opacity-90"}`}
        >
            {pending ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Traitement...
                </span>
            ) : (
                "Se connecter"
            )}
        </button>

    );
}
