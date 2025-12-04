"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";

export const ToastProvider = ToastPrimitives.Provider;

// Viewport premium
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex flex-col gap-3 w-80 max-w-full",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

// Variants premium
const toastVariants = cva(
  "group relative flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg transition-all dark:bg-neutral-900",
  {
    variants: {
      variant: {
        success:
          "border-green-200 dark:border-green-800 before:bg-green-500",
        error:
          "border-red-200 dark:border-red-800 before:bg-red-500",
        warning:
          "border-yellow-200 dark:border-yellow-800 before:bg-yellow-500",
        info:
          "border-blue-200 dark:border-blue-800 before:bg-blue-500",
        default:
          "border-neutral-200 dark:border-neutral-800 before:bg-neutral-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Types
export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>;

export type ToastActionElement = React.ReactElement;

// Root
export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      toastVariants({ variant }),
      // left color bar premium
      "before:absolute before:left-0 before:top-0 before:h-full before:w-1 rounded-l-xl",
      // animations
      "data-[state=open]:animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-right",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-90 data-[state=closed]:slide-out-to-right",
      className
    )}
    {...props}
  />
));
Toast.displayName = "Toast";

// Icon by variant
type ToastVariant = "success" | "error" | "warning" | "info" | "default";

const icons: Record<ToastVariant, React.ReactElement> = {
  success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
  error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  default: <Info className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />,
};

// Title
export const ToastTitle = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50" {...props}>
    {children}
  </div>
);

// Description
export const ToastDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="text-sm text-neutral-600 dark:text-neutral-300" {...props}>
    {children}
  </p>
);

// Close button
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = "ToastClose";

// Main layout (with icon)
export const ToastContent = ({
  variant,
  title,
  description,
}: {
  variant?: ToastVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
}) => {
  const variantKey: ToastVariant = (variant && variant in icons) ? variant : "default";
  
  return (
    <div className="flex flex-row gap-3 pr-5">
      <div className="pt-1">{icons[variantKey]}</div>
      <div className="flex flex-col gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
    </div>
  );
};
