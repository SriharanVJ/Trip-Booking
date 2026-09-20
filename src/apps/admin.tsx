// Admin operations console — drivers, bookings, pricing, dues.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck, Ban, CarFront, Check, Clock3, IndianRupee, Loader2, Route as RouteIcon,
  Settings2, UserPlus, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoginScreen } from "@/components/login-screen";
import {
  AppHeader, Card, EmptyState, ErrorBanner, IconTile, Loading, MetricCard,
  RoleSwitcher, SectionHeading, StatusBadge,
} from "@/lib/acting-driver";
import { useSession } from "@/lib/auth";
import {
  STATUS_META, adminApi, fmtDateTime, initials, money,
  type Booking, type BookingStatus, type DriverProfile, type PricingConfig, type Session,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function AdminApp() {
  const { session, ready, login, logout } = useSession("admin");
  if (!ready) return null;
  if (!session) return <LoginScreen role="admin" onLogin={login} />;
  return <AdminWorkspace session={session} onLogout={logout} />;
}

const VERIFY_META: Record<DriverProfile["verification_status"], { label: string; tone: "blue" | "green" | "orange" | "red" }> = {
  pending: { label: "Pending review", tone: "orange" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

function AdminWorkspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { token, user } = session;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const drivers = useQuery({
    queryKey: ["admin-drivers", token],
    queryFn: () => adminApi.drivers(token),
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings", token],
    queryFn: () => adminApi.bookings(token),
  });
  const pricing = useQuery({
    queryKey: ["admin-pricing", token],
    queryFn: () => adminApi.pricing(token),
  });
  const dues = useQuery({
    queryKey: ["admin-dues", token],
    queryFn: () => adminApi.dues(token),
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-drivers", token] });
    void queryClient.invalidateQueries({ queryKey: ["admin-bookings", token] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dues", token] });
  };

  const verify = useMutation({
    mutationFn: ({ driverId, action }: { driverId: string; action: "approve" | "reject" }) =>
      adminApi.verifyDriver(token, driverId, action),
    onSuccess: () => { setError(null); void queryClient.invalidateQueries({ queryKey: ["admin-drivers", token] }); },
    onError: (err) => setError(err instanceof Error ? err.message : "Verification action failed"),
  });

  const clearDues = useMutation({
    mutationFn: (customerId: string) => adminApi.clearDues(token, customerId),
    onSuccess: () => { setError(null); void queryClient.invalidateQueries({ queryKey: ["admin-dues", token] }); },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not clear dues"),
  });

  const allBookings = bookings.data?.bookings ?? [];
  const driverList = drivers.data?.drivers ?? [];
  const pendingDrivers = driverList.filter((d) => d.verification_status === "pending");
  const ongoing = allBookings.filter((b) =>
    ["requested", "searching", "driver_assigned", "trip_started"].includes(b.status)).length;
  const revenue = allBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.fares.total_fare ?? 0), 0);
  const filtered = statusFilter === "all" ? allBookings : allBookings.filter((b) => b.status === statusFilter);

  return <div className="min-h-screen bg-background">
    <AppHeader role="admin" name={user.name ?? "Admin"} onLogout={onLogout} />
    <main className="container-shell py-10">
      <div className="max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-3">Operations console</p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Fleet overview<span className="text-brand">.</span></h1>
            <p className="mt-3 max-w-md text-muted-foreground">Live bookings, driver verification, pricing and dues — all in one place.</p>
          </div>
          <RoleSwitcher active="admin" />
        </div>

        {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total bookings" value={String(allBookings.length)} icon={<RouteIcon />} tone="blue" />
          <MetricCard label="Ongoing now" value={String(ongoing)} icon={<Clock3 />} tone="orange" detail="requested → in trip" />
          <MetricCard label="Completed revenue" value={money(revenue)} icon={<IndianRupee />} tone="green" footnote="Collected fares" />
          <MetricCard label="Pending verification" value={String(pendingDrivers.length)} icon={<BadgeCheck />} tone="red" detail="drivers waiting" />
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow="Live monitor" title="All bookings" />
          <div className="mb-4 flex items-center gap-3">
            <select className="select-control h-10 w-52" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | BookingStatus)}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
            <span className="text-sm text-muted-foreground">{filtered.length} booking{filtered.length === 1 ? "" : "s"}</span>
          </div>
          <Card className="overflow-hidden p-0">
            {!bookings.isLoading && filtered.length === 0 ? (
              <div className="p-0"><EmptyState icon={<RouteIcon />} title="No bookings yet" detail="Bookings from the customer app appear here in real time." /></div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Booking</th><th>Customer</th><th>Driver</th><th>Type</th><th>Status</th><th className="text-right">Fare</th><th>When</th></tr>
                  </thead>
                  <tbody>
                    {bookings.isLoading ? (
                      <tr><td colSpan={7}><Loading /></td></tr>
                    ) : filtered.map((b) => {
                      const meta = STATUS_META[b.status];
                      return (
                        <tr key={b.id}>
                          <td className="font-mono text-xs">#{b.id.slice(0, 8)}</td>
                          <td>{b.customer?.name ?? "—"}</td>
                          <td>{b.driver?.name ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                          <td className="text-muted-foreground">{b.type === "hourly" ? `${b.hours} h` : "location"}</td>
                          <td><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></td>
                          <td className="text-right font-semibold">{b.fares.total_fare != null ? money(b.fares.total_fare) : "—"}</td>
                          <td className="text-muted-foreground">{fmtDateTime(b.requested_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading eyebrow="Onboarding" title="Driver verification" />
          {drivers.isLoading ? <Loading /> : pendingDrivers.length === 0 ? (
            <EmptyState icon={<BadgeCheck />} title="No pending drivers" detail="Every registered driver has been reviewed." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingDrivers.map((driver) => (
                <PendingDriverCard key={driver.driver_id} driver={driver} busy={verify.isPending} onVerify={(action) => verify.mutate({ driverId: driver.driver_id, action })} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <SectionHeading
            eyebrow="Fleet"
            title="All drivers"
            action={<Button onClick={() => setCreateOpen(true)}><UserPlus /> Add driver</Button>}
          />
          <Card className="overflow-hidden p-0">
            {!drivers.isLoading && driverList.length === 0 ? (
              <div className="p-0"><EmptyState icon={<CarFront />} title="No drivers yet" detail="Add a driver directly, or they can sign up from the driver app." /></div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Driver</th><th>License</th><th>Verification</th><th>Online</th><th>Source</th><th className="text-right">Rating</th><th className="text-right">Trips</th><th>Added</th></tr>
                  </thead>
                  <tbody>
                    {drivers.isLoading ? (
                      <tr><td colSpan={8}><Loading /></td></tr>
                    ) : driverList.map((d) => {
                      const meta = VERIFY_META[d.verification_status];
                      return (
                        <tr key={d.driver_id}>
                          <td>
                            <p className="font-semibold text-foreground">{d.name ?? "Unnamed driver"}</p>
                            <p className="text-xs text-muted-foreground">{d.phone}</p>
                          </td>
                          <td className="text-muted-foreground">{d.license_no ?? "—"}</td>
                          <td><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></td>
                          <td>{d.is_online
                            ? <StatusBadge tone="green">Online</StatusBadge>
                            : <span className="text-sm text-muted-foreground">Offline</span>}</td>
                          <td>{d.created_by === "admin"
                            ? <StatusBadge tone="blue">Admin</StatusBadge>
                            : <span className="text-sm text-muted-foreground">Sign-up</span>}</td>
                          <td className="text-right">{d.rating_avg > 0 ? `${d.rating_avg.toFixed(1)} ★` : "—"}</td>
                          <td className="text-right">{d.total_trips}</td>
                          <td className="text-muted-foreground">{d.created_at ? fmtDateTime(d.created_at) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Source shows how the account joined — <strong className="text-foreground">Admin</strong> accounts
            were created here without an OTP; the driver still logs in with their number via the normal OTP flow.
          </p>
        </section>

        {createOpen && <CreateDriverDialog token={token} onClose={() => setCreateOpen(false)} />}

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {pricing.data && <PricingCard token={token} config={pricing.data} />}
          <DuesCard token={token} dues={dues.data} loading={dues.isLoading} clearing={clearDues.isPending} onClear={(id) => clearDues.mutate(id)} />
        </div>
      </div>
    </main>
  </div>;
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

function CreateDriverDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ phone: "", name: "", license_no: "", license_doc_url: "" });
  const [preVerified, setPreVerified] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => adminApi.createDriver(token, {
      phone: form.phone.trim(),
      name: form.name.trim(),
      license_no: form.license_no.trim(),
      license_doc_url: form.license_doc_url.trim() || null,
      pre_verified: preVerified,
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-drivers", token] });
      onClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not create driver"),
  });

  const valid = form.phone.trim().length >= 8 && form.name.trim().length > 0 && form.license_no.trim().length > 0;

  const field = (key: keyof typeof form, label: string, placeholder: string, optional = false) => (
    <div>
      <label className="form-label" htmlFor={`driver-${key}`}>{label}{optional && <span className="text-muted-foreground"> · optional</span>}</label>
      <Input
        id={`driver-${key}`}
        placeholder={placeholder}
        value={form[key]}
        onChange={(event) => { setForm((prev) => ({ ...prev, [key]: event.target.value })); setError(null); }}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a driver</DialogTitle>
          <DialogDescription>
            Creates the account directly — no OTP needed. The driver logs in later
            with this number through the normal OTP flow.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (valid && !create.isPending) create.mutate(); }}>
          {field("phone", "Phone number", "98765 43210")}
          {field("name", "Full name", "Ravi Kumar")}
          {field("license_no", "License number", "TN01 20230012345")}
          {field("license_doc_url", "License document URL", "https://…/license.jpg", true)}
          <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary p-4 text-sm">
            <div>
              <p className="font-medium text-secondary-foreground">Pre-verified</p>
              <p className="mt-0.5 text-xs text-muted-foreground">License checked in person — skips the review queue.</p>
            </div>
            <Switch checked={preVerified} onCheckedChange={(checked) => { setPreVerified(checked); setError(null); }} />
          </div>
          {error && <ErrorBanner message={error} />}
          <DialogFooter className="gap-3 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? <Loader2 className="animate-spin" /> : <><UserPlus /> Create driver</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingDriverCard({ driver, busy, onVerify }: {
  driver: DriverProfile; busy: boolean; onVerify: (action: "approve" | "reject") => void;
}) {
  return <Card className="p-5">
    <div className="flex items-center gap-4">
      <IconTile tone="orange"><CarFront /></IconTile>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{driver.name ?? "Unnamed driver"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{driver.phone} · License {driver.license_no ?? "—"}</p>
      </div>
      <span className="status-badge status-orange">pending</span>
    </div>
    <p className="mt-3 truncate text-xs text-muted-foreground">Document: {driver.license_doc_url ?? "none uploaded"}</p>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Button variant="outline" disabled={busy} onClick={() => onVerify("reject")}><X /> Reject</Button>
      <Button disabled={busy} onClick={() => onVerify("approve")}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Approve</Button>
    </div>
  </Card>;
}

function PricingCard({ token, config }: { token: string; config: PricingConfig }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => serializeForm(config));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof serializeForm>) => adminApi.updatePricing(token, {
      per_km_rate: Number(payload.per_km_rate),
      per_hour_rate: Number(payload.per_hour_rate),
      pickup_free_km_limit: Number(payload.pickup_free_km_limit),
      pickup_charge_per_km: Number(payload.pickup_charge_per_km),
      cancellation_fee_percent: Number(payload.cancellation_fee_percent),
      matching_radius_km: Number(payload.matching_radius_km),
    }),
    onSuccess: (updated) => {
      setError(null);
      setSaved(true);
      setForm(serializeForm(updated));
      void queryClient.invalidateQueries({ queryKey: ["admin-pricing", token] });
      window.setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save pricing"),
  });

  const field = (key: keyof ReturnType<typeof serializeForm>, label: string) => (
    <div key={key}>
      <label className="form-label" htmlFor={`pricing-${key}`}>{label}</label>
      <Input
        id={`pricing-${key}`} type="number" min="0" step="any"
        value={form[key]}
        onChange={(event) => { setForm((prev) => ({ ...prev, [key]: event.target.value })); setSaved(false); }}
      />
    </div>
  );

  return <Card className="p-6">
    <div className="flex items-center gap-3">
      <IconTile tone="blue"><Settings2 /></IconTile>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Pricing & matching</h2>
        <p className="text-sm text-muted-foreground">Applies to every new fare estimate instantly.</p>
      </div>
    </div>
    {config.updated_at && <p className="mt-4 text-xs text-muted-foreground">Last updated {fmtDateTime(config.updated_at)}</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      {field("per_km_rate", "Per km rate (₹)")}
      {field("per_hour_rate", "Per hour rate (₹)")}
      {field("pickup_free_km_limit", "Pickup free km")}
      {field("pickup_charge_per_km", "Pickup charge ₹/km")}
      {field("cancellation_fee_percent", "Cancellation fee %")}
      {field("matching_radius_km", "Matching radius (km)")}
    </div>
    <div className="mt-6 flex items-center justify-between rounded-xl bg-secondary p-4 text-sm">
      <span className="text-secondary-foreground">Block bookings when dues pending</span>
      <span className={cn("font-semibold", config.block_booking_if_dues_exceed ? "text-destructive" : "text-chart-2")}>
        {config.block_booking_if_dues_exceed ? "ON" : "OFF"}
      </span>
    </div>
    {error && <div className="mt-5"><ErrorBanner message={error} /></div>}
    <Button className="mt-6 w-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
      {save.isPending ? <Loader2 className="animate-spin" /> : saved ? <><Check /> Saved</> : "Save pricing config"}
    </Button>
  </Card>;
}

function serializeForm(config: PricingConfig) {
  return {
    per_km_rate: String(config.per_km_rate),
    per_hour_rate: String(config.per_hour_rate),
    pickup_free_km_limit: String(config.pickup_free_km_limit),
    pickup_charge_per_km: String(config.pickup_charge_per_km),
    cancellation_fee_percent: String(config.cancellation_fee_percent),
    matching_radius_km: String(config.matching_radius_km),
  };
}

function DuesCard({ token, dues, loading, clearing, onClear }: {
  token: string;
  dues: { customers: { customer_id: string; name: string | null; phone: string; pending_dues: number }[]; count: number } | undefined;
  loading: boolean; clearing: boolean; onClear: (customerId: string) => void;
}) {
  const rows = dues?.customers ?? [];
  return <Card className="p-6">
    <div className="flex items-center gap-3">
      <IconTile tone="red"><Ban /></IconTile>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Customer dues</h2>
        <p className="text-sm text-muted-foreground">Cancellation fees awaiting settlement.</p>
      </div>
    </div>
    <div className="mt-6 space-y-3">
      {loading ? <Loading /> : rows.length === 0 ? (
        <EmptyState icon={<Wallet />} title="No dues pending" detail="Every customer is settled up." />
      ) : rows.map((row) => (
        <div key={row.customer_id} className="flex items-center justify-between gap-4 rounded-xl bg-secondary p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{row.name ?? "Unnamed customer"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold text-destructive">{money(row.pending_dues)}</span>
            <Button size="sm" variant="outline" disabled={clearing} onClick={() => onClear(row.customer_id)}>Clear</Button>
          </div>
        </div>
      ))}
    </div>
    {dues && dues.count > 0 && (
      <p className="mt-4 text-xs text-muted-foreground">{dues.count} customer{dues.count === 1 ? "" : "s"} with dues · total {money(rows.reduce((sum, r) => sum + Number(r.pending_dues), 0))}</p>
    )}
  </Card>;
}
