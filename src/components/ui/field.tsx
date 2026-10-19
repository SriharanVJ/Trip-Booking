import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FieldProps {
  /** Field label text. */
  label: string;
  /** id of the control this label describes. */
  htmlFor?: string;
  /** Marks the field required — renders the gold asterisk indicator. */
  required?: boolean;
  /** Validation error message; replaces the hint and turns the label red. */
  error?: string;
  /** Optional helper text shown below the control. */
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Unified form field wrapper: label with gold required marker, the control,
 * then hint or error. Every booking form on the platform renders through
 * this so labels, required indicators, and error styling match exactly.
 */
export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12.5px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
