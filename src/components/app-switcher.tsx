import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

/**
 * Floating "back to all apps" affordance for the Acting Driver screens, whose
 * own full-screen UIs have no navigation of their own. Book Travels gets its
 * switch-app link inside its regular header instead.
 */
export function AppSwitcher() {
  return (
    <Link
      to="/"
      title="All apps"
      className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur transition hover:border-slate-300 hover:bg-white"
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      Apps
    </Link>
  );
}
