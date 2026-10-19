import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "blue" | "green" | "orange" | "red" | "gold";

const toneClasses: Record<StatusTone, string> = {
  blue: "status-blue",
  green: "status-green",
  orange: "status-orange",
  red: "status-red",
  gold: "badge-gold",
};

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}

/**
 * Unified status pill. Tones map onto the shared status palette
 * (blue = in progress / info, green = success, orange = pending / warning,
 * red = cancelled / failure, gold = premium highlight).
 */
export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", toneClasses[tone], className)}>{children}</span>
  );
}
