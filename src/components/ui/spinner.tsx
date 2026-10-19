import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual size of the spinner. */
  size?: keyof typeof spinnerSizes;
  /** Accessible label; defaults to a visually-hidden "Loading". */
  label?: string;
}

/** Unified loading spinner — gold on dark via currentColor. */
export function Spinner({ size = "default", label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-current", spinnerSizes[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
