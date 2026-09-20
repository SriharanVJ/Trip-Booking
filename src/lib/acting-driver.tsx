// Shared design-system pieces for the three Acting Driver workspaces.
// The role-specific apps live in src/apps/{customer,driver,admin}.tsx.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Home,
  MapPin,
  Navigation,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { initials as toInitials, money } from "@/lib/api";

export type { BookingType } from "@/lib/api";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Acting Driver home">
      <span className="brand-mark"><CarFront className="size-5" strokeWidth={2.6} /></span>
      {!compact && <span className="font-display text-lg font-bold tracking-tight text-foreground">acting<span className="text-brand">driver</span></span>}
    </Link>
  );
}

export function Avatar({ initials = "AD", dark = false }: { initials?: string; dark?: boolean }) {
  return <span className={cn("avatar-ring", dark && "avatar-ring-dark")}>{initials}</span>;
}

export function StatusBadge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "orange" | "red" }) {
  return <Badge className={cn("status-badge", `status-${tone}`)}>{children}</Badge>;
}

export function MapPlaceholder({ live = false, compact = false }: { live?: boolean; compact?: boolean }) {
  return (
    <div className={cn("map-placeholder", compact && "map-placeholder-compact")} aria-label="Map preview">
      <div className="map-road map-road-one" />
      <div className="map-road map-road-two" />
      <div className="map-road map-road-three" />
      <div className="map-road map-road-four" />
      <div className="map-block map-block-one" />
      <div className="map-block map-block-two" />
      <div className="map-block map-block-three" />
      <div className="map-block map-block-four" />
      <span className="map-label map-label-one">Indiranagar</span>
      <span className="map-label map-label-two">Koramangala</span>
      <span className="map-label map-label-three">Domlur</span>
      <span className="map-pin map-pin-start"><MapPin className="size-4" fill="currentColor" /></span>
      <span className="map-pin map-pin-end"><Navigation className="size-4" fill="currentColor" /></span>
      {live && <span className="map-live"><span /> Live route</span>}
    </div>
  );
}

export function AppHeader({ role, name, onLogout }: {
  role: "customer" | "driver" | "admin";
  name?: string | null;
  onLogout?: () => void;
}) {
  const fallback = role === "admin" ? "AD" : role === "driver" ? "DR" : "CU";
  return (
    <header className="app-header">
      <div className="container-shell flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Brand />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">{role} workspace</span>
        </div>
        <div className="flex items-center gap-3">
          {onLogout && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onLogout}>
              Log out
            </Button>
          )}
          <Avatar initials={toInitials(name, fallback)} />
        </div>
      </div>
    </header>
  );
}

export function RoleSwitcher({ active }: { active: "customer" | "driver" | "admin" }) {
  return (
    <div className="role-switcher" aria-label="Switch workspace">
      <Link to="/" className={cn(active === "customer" && "role-active")}>Customer</Link>
      <Link to="/driver" className={cn(active === "driver" && "role-active")}>Driver</Link>
      <Link to="/driver/admin" className={cn(active === "admin" && "role-active")}>Admin</Link>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{title}</h2></div>{action}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("surface-card", className)}>{children}</div>;
}

export function IconTile({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "orange" | "green" | "red" }) {
  return <span className={cn("icon-tile", `icon-tile-${tone}`)}>{children}</span>;
}

export function ActionButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" className="w-full justify-between rounded-xl px-5" {...props}>{children}<ArrowRight /></Button>;
}

export function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="mb-8 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back"><ArrowLeft /></Button><h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1></div>;
}

export function MobileNav({ view, setView }: { view: string; setView: (view: string) => void }) {
  const items = [["home", "Home", Home], ["history", "Bookings", RouteIcon], ["profile", "Profile", UserRound]] as const;
  return <nav className="mobile-nav">{items.map(([key, label, Icon]) => <button key={key} className={cn(view === key && "mobile-nav-active")} onClick={() => setView(key)}><Icon /><span>{label}</span></button>)}</nav>;
}

export function MetricCard({ label, value, detail, icon, tone = "blue", footnote = "Live" }: {
  label: string; value: string; detail?: string; icon: ReactNode; tone?: "blue" | "orange" | "green" | "red"; footnote?: string;
}) {
  return <Card className="p-5"><div className="flex items-center justify-between"><IconTile tone={tone}>{icon}</IconTile><span className="text-xs text-muted-foreground">{footnote}</span></div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>{detail && <p className="mt-2 text-xs font-medium text-brand">{detail}</p>}</Card>;
}

/** Data-driven fare breakdown (the old one was hardcoded). */
export function FareBreakdown({ rows, total, totalLabel = "Estimated total" }: {
  rows: { label: string; value: string }[];
  total: string;
  totalLabel?: string;
}) {
  return <div className="space-y-3 text-sm">
    {rows.map((row) => <div key={row.label} className="flex justify-between"><span className="text-muted-foreground">{row.label}</span><span className="font-medium text-foreground">{row.value}</span></div>)}
    <div className="my-3 border-t border-border" />
    <div className="flex items-center justify-between"><span className="font-semibold text-foreground">{totalLabel}</span><span className="font-display text-2xl font-bold text-brand">{total}</span></div>
  </div>;
}

export function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail?: string }) {
  return <Card className="p-10 text-center"><span className="empty-icon">{icon}</span><h3 className="mt-5 font-display text-xl font-bold text-foreground">{title}</h3>{detail && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>}</Card>;
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</div>;
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-foreground">{children}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="py-24 text-center text-sm text-muted-foreground">{label}</div>;
}

export { money };
