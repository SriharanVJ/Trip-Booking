// Driver workspace — offers arrive over WebSocket; lists refresh on socket
// events, own actions and reconnects. No polling anywhere.
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CarFront, Check, Clock3, FileUp, Loader2, MapPin, Phone,
  Route as RouteIcon, ShieldCheck, Star, Wallet, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoginScreen } from "@/components/login-screen";
import {
  ActionButton, AppHeader, Avatar, BackBar, Card, EmptyState, ErrorBanner,
  IconTile, Loading, MapPlaceholder, MetricCard, MobileNav, SectionHeading,
  StatusBadge,
} from "@/lib/acting-driver";

import { useSession } from "@/lib/auth";
import { useRealtime } from "@/hooks/use-realtime";
import {
  ACTIVE_STATUSES, STATUS_META, customerApi, driverApi, fmtDateTime, getCurrentPosition,
  initials, km, money, type Booking, type DriverProfile, type Session,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function DriverApp() {
  const { session, ready, login, logout } = useSession("driver");
  if (!ready) return null;
  if (!session) return <LoginScreen role="driver" onLogin={login} />;
  return <DriverWorkspace session={session} onLogout={logout} />;
}

/** Coarsened booking pushed over WS as booking:new_request. */
interface Offer {
  id: string;
  type: "location" | "hourly";
  hours: number | null;
  trip_distance_km: number | null;
  total_fare: number | null;
  pickup_lat: number;
  pickup_lng: number;
  receivedAt: number;
}

type View = "home" | "history" | "profile";

function DriverWorkspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { token, user } = session;
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("home");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const profile = useQuery({
    queryKey: ["driver-profile", user.id],
    queryFn: () => driverApi.profile(token),
  });
  const history = useQuery({
    queryKey: ["driver-bookings", user.id],
    queryFn: () => driverApi.bookings(token),
  });
  const earnings = useQuery({
    queryKey: ["driver-earnings", user.id],
    queryFn: () => driverApi.earnings(token),
  });
  const booking = useQuery({
    queryKey: ["driver-booking", activeId],
    queryFn: () => customerApi.booking(token, activeId!),
    enabled: activeId != null,
  });

  // Restore an in-progress job after a refresh.
  useEffect(() => {
    if (activeId || !history.data) return;
    const live = history.data.bookings.find((b) => ACTIVE_STATUSES.includes(b.status));
    if (live) setActiveId(live.id);
  }, [activeId, history.data]);

  const connected = useRealtime({
    role: "driver", userId: user.id, token,
    onEvent: (event, data) => {
      if (event === "booking:new_request" && data["booking"]) {
        const b = data["booking"] as Booking;
        setOffers((prev) => prev.some((o) => o.id === b.id) ? prev : [
          ...prev,
          {
            id: b.id, type: b.type, hours: b.hours ?? null,
            trip_distance_km: b.trip_distance_km ?? null,
            total_fare: b.fares?.total_fare ?? null,
            pickup_lat: b.pickup.lat, pickup_lng: b.pickup.lng,
            receivedAt: Date.now(),
          },
        ]);
      }
      if (event === "booking:cancelled") {
        const id = data["booking_id"] as string | undefined;
        if (id) setOffers((prev) => prev.filter((o) => o.id !== id));
        if (id && id === activeId) {
          setBanner(String(data["message"] ?? "The customer cancelled this booking."));
        }
        if (id) {
          void queryClient.invalidateQueries({ queryKey: ["driver-booking", id] });
          void queryClient.invalidateQueries({ queryKey: ["driver-bookings", user.id] });
        }
      }
      if (event === "booking:status_update") {
        void queryClient.invalidateQueries({ queryKey: ["driver-booking", data["booking_id"]] });
      }
    },
  });

  // Catch-up after a reconnect (backend restart, laptop sleep): events fired
  // while the socket was down are gone, so re-pull everything once. The first
  // connect is skipped — the mount fetches just happened.
  const wasConnected = useRef(false);
  useEffect(() => {
    if (!connected) return;
    if (wasConnected.current) {
      void queryClient.invalidateQueries({ queryKey: ["driver-profile", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["driver-bookings", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["driver-earnings", user.id] });
      if (activeId) void queryClient.invalidateQueries({ queryKey: ["driver-booking", activeId] });
    }
    wasConnected.current = true;
  }, [connected, user.id, activeId, queryClient]);

  // Offers expire after 3 minutes without a decision.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setOffers((prev) => prev.filter((o) => Date.now() - o.receivedAt < 180_000));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const online = profile.data?.is_online ?? false;
  // Keep the backend geo-index warm while online — this is what matching uses.
  useEffect(() => {
    if (!online) return;
    const ping = async () => {
      try {
        const pos = await getCurrentPosition();
        await driverApi.sendLocation(token, pos.coords.latitude, pos.coords.longitude);
      } catch { /* transient GPS loss — next tick retries */ }
    };
    void ping();
    const timer = window.setInterval(ping, 30_000);
    return () => window.clearInterval(timer);
  }, [online, token]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["driver-bookings", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["driver-earnings", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["driver-profile", user.id] });
  };

  const setOnline = useMutation({
    mutationFn: (next: boolean) => driverApi.setOnline(token, next),
    onSuccess: (updated) => queryClient.setQueryData(["driver-profile", user.id], updated),
  });

  const toggleOnline = async (next: boolean) => {
    setError(null);
    if (!next) { setOnline.mutate(false); return; }
    try {
      setLocating(true);
      const pos = await getCurrentPosition();
      await driverApi.sendLocation(token, pos.coords.latitude, pos.coords.longitude);
      setOnline.mutate(true);
    } catch (err) {
      setError(err instanceof Error ? `Could not get your location: ${err.message}` : "Could not get your location");
    } finally {
      setLocating(false);
    }
  };

  // Marking offline before clearing the session keeps the backend's view
  // truthful even if the WebSocket close races the unmount (the server-side
  // disconnect handler is the safety net, this makes it deterministic).
  const handleLogout = async () => {
    if (online) {
      try { await driverApi.setOnline(token, false); } catch { /* best effort */ }
    }
    onLogout();
  };

  const accept = useMutation({
    mutationFn: (id: string) => driverApi.accept(token, id),
    onSuccess: (res, id) => {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      setActiveId(res.booking.id);
      invalidateAll();
    },
    onError: (err, id) => {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      setError(err instanceof Error ? err.message : "Could not accept this booking");
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => driverApi.reject(token, id),
    onSuccess: (_res, id) => setOffers((prev) => prev.filter((o) => o.id !== id)),
  });

  const frame = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <AppHeader role="driver" name={profile.data?.name ?? user.name} onLogout={handleLogout} />
      <main className="container-shell pb-28 pt-8 lg:pb-12">{children}</main>
      <MobileNav view={view} setView={(next) => { setBanner(null); setError(null); setView(next as View); }} />
    </div>
  );

  if (profile.isLoading) return frame(<Loading label="Loading your driver profile…" />);

  // Unverified drivers are stopped here — matching only notifies approved drivers.
  if (profile.data && profile.data.verification_status !== "approved") {
    return frame(<VerificationGate token={token} profile={profile.data} onUploaded={invalidateAll} onRecheck={invalidateAll} />);
  }

  // Active job takes over the screen.
  if (activeId) {
    if (booking.isLoading) return frame(<Loading label="Loading your job…" />);
    if (booking.isError) {
      return frame(
        <div className="mx-auto max-w-lg">
          <ErrorBanner message="Could not load this booking." />
          <Button variant="outline" className="w-full" onClick={() => setActiveId(null)}>Back to dashboard</Button>
        </div>,
      );
    }
    if (booking.data) {
      return frame(
        <ActiveJob
          token={token}
          booking={booking.data}
          banner={banner}
          onCloseBanner={() => setBanner(null)}
          onDone={() => { setActiveId(null); setBanner(null); invalidateAll(); }}
          onChanged={invalidateAll}
        />,
      );
    }
  }

  if (view === "history") return frame(<DriverHistory bookings={history.data?.bookings} loading={history.isLoading} onOpen={setActiveId} />);
  if (view === "profile") return frame(<DriverProfileView token={token} profile={profile.data} onSaved={invalidateAll} />);

  return frame(
    <DriverDashboard
      online={online}
      locating={locating}
      toggling={setOnline.isPending}
      offers={offers}
      earnings={earnings.data}
      rating={profile.data?.rating_avg ?? 0}
      cancellations={profile.data?.cancellation_count ?? 0}
      recent={history.data?.bookings.slice(0, 4)}
      error={error}
      banner={banner}
      accepting={accept.isPending}
      rejecting={reject.isPending}
      onToggleOnline={toggleOnline}
      onAccept={(id) => accept.mutate(id)}
      onReject={(id) => reject.mutate(id)}
      onOpen={(id) => setActiveId(id)}
      onCloseBanner={() => setBanner(null)}
      onCloseError={() => setError(null)}
    />,
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function DriverDashboard({ online, locating, toggling, offers, earnings, rating, cancellations, recent, error, banner, accepting, rejecting, onToggleOnline, onAccept, onReject, onOpen, onCloseBanner, onCloseError }: {
  online: boolean; locating: boolean; toggling: boolean;
  offers: Offer[]; earnings: { total_earnings: number; collected: number; pending_payment: number; total_trips: number; completed_bookings: number } | undefined;
  rating: number; cancellations: number; recent: Booking[] | undefined;
  error: string | null; banner: string | null; accepting: boolean; rejecting: boolean;
  onToggleOnline: (next: boolean) => void; onAccept: (id: string) => void; onReject: (id: string) => void;
  onOpen: (id: string) => void; onCloseBanner: () => void; onCloseError: () => void;
}) {
  return <div className="max-w-5xl">
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="eyebrow mb-3">Driver workspace</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {online ? "You're online." : "Ready to drive?"}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {online ? "We're matching you with nearby requests." : "Go online to start receiving ride requests."}
        </p>
      </div>
      <div className={cn("online-bar", online && "online-bar-active")}>
        <span className="flex items-center gap-2">
          <span className="online-pulse" />{online ? "Online — receiving requests" : "Offline"}
        </span>
        <Switch checked={online} disabled={locating || toggling} onCheckedChange={onToggleOnline} aria-label="Toggle online status" />
      </div>
    </div>

    {error && (
      <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <span>{error}</span>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCloseError} aria-label="Dismiss"><X className="size-4" /></Button>
      </div>
    )}
    {banner && (
      <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-foreground">
        <span>{banner}</span>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCloseBanner} aria-label="Dismiss"><X className="size-4" /></Button>
      </div>
    )}

    <section className="grid gap-4 lg:grid-cols-3">
      {offers.length === 0 ? (
        <Card className="p-10 text-center lg:col-span-2">
          <div className="radar-wrap"><div className="radar-ring radar-ring-one" /><div className="radar-ring radar-ring-two" /><span className="radar-center"><CarFront /></span></div>
          <p className="eyebrow mt-10">{online ? "Listening" : "Paused"}</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
            {online ? "Waiting for ride requests…" : "You're offline"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {online
              ? "New requests pop up here the moment a customer books nearby."
              : "Flip the switch above — we'll find requests around your current location."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:col-span-2">
          {offers.map((offer) => (
            <div key={offer.id} className="request-card">
              <div className="request-pulse" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <IconTile tone={offer.type === "hourly" ? "orange" : "blue"}>{offer.type === "hourly" ? <Clock3 /> : <RouteIcon />}</IconTile>
                  <div>
                    <p className="eyebrow">New request</p>
                    <h3 className="mt-1 font-display text-xl font-bold text-foreground">
                      {offer.type === "hourly" ? `${offer.hours} hour booking` : `Trip of ${km(offer.trip_distance_km)}`}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 text-brand" /> Pickup near {offer.pickup_lat.toFixed(3)}, {offer.pickup_lng.toFixed(3)}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-display text-2xl font-bold text-brand">{offer.total_fare != null ? money(offer.total_fare) : "—"}</p>
                  <p className="text-xs text-muted-foreground">your earning</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={rejecting} onClick={() => onReject(offer.id)}>Skip</Button>
                <Button disabled={accepting} onClick={() => onAccept(offer.id)}>
                  {accepting ? <Loader2 className="animate-spin" /> : "Accept"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid content-start gap-4">
        <MetricCard label="Total earnings" value={money(earnings?.total_earnings)} icon={<Wallet />} tone="green" detail={`${money(earnings?.pending_payment)} awaiting collection`} />
        <MetricCard label="Completed trips" value={String(earnings?.total_trips ?? 0)} icon={<RouteIcon />} tone="blue" />
        <MetricCard label="Rating" value={rating > 0 ? rating.toFixed(1) : "—"} icon={<Star />} tone="orange" detail={`${cancellations} cancellations`} />
      </div>
    </section>

    <section className="mt-12">
      <SectionHeading eyebrow="Your activity" title="Recent jobs" />
      {!recent ? <Loading /> : recent.length === 0 ? (
        <EmptyState icon={<RouteIcon />} title="No jobs yet" detail="Your completed and cancelled jobs will appear here." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {recent.map((b) => <DriverBookingRow key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}
        </div>
      )}
    </section>
  </div>;
}

export function DriverBookingRow({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const meta = STATUS_META[booking.status];
  const title = booking.type === "hourly"
    ? `${booking.hours} hour booking`
    : `${booking.pickup.address_text ?? "Pickup"} → ${booking.drop?.address_text ?? "Drop"}`;
  return (
    <Card className="p-5">
      <button className="w-full text-left" onClick={onOpen}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-foreground">{title}</p>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{fmtDateTime(booking.completed_at ?? booking.cancelled_at ?? booking.started_at ?? booking.requested_at)} · #{booking.id.slice(0, 8)}</span>
          <span className="font-semibold text-foreground">{booking.fares.total_fare != null ? money(booking.fares.total_fare) : "—"}</span>
        </div>
      </button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Active job
// ---------------------------------------------------------------------------

function ActiveJob({ token, booking, banner, onCloseBanner, onDone, onChanged }: {
  token: string; booking: Booking; banner: string | null;
  onCloseBanner: () => void; onDone: () => void; onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["driver-booking", booking.id] });
    onChanged();
  };

  const action = useMutation({
    mutationFn: (kind: "start" | "complete" | "paid") =>
      kind === "start" ? driverApi.startTrip(token, booking.id)
        : kind === "complete" ? driverApi.completeTrip(token, booking.id)
        : driverApi.markPaid(token, booking.id),
    onSuccess: (_res, kind) => {
      setError(null);
      invalidate();
      if (kind === "paid") onDone();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Action failed"),
  });

  const customerName = booking.customer?.name ?? "your customer";
  const customerPhone = booking.customer?.phone ?? null;
  const title = booking.type === "hourly" ? `${booking.hours} hour booking` : `Trip of ${km(booking.trip_distance_km)}`;

  return <div className="max-w-3xl">
    {banner && (
      <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-foreground">
        <span>{banner}</span>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCloseBanner} aria-label="Dismiss"><X className="size-4" /></Button>
      </div>
    )}

    {booking.status === "driver_assigned" && (
      <>
        <BackBar title="Pickup" onBack={onDone} />
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-brand">
          <span className="status-dot" /> {km(booking.pickup_distance_km)} to pickup
        </div>
        <MapPlaceholder compact />
        <Card className="mt-5 p-5 sm:p-6">
          <p className="eyebrow">{title} · #{booking.id.slice(0, 8)}</p>
          <div className="mt-4 flex items-center gap-4">
            <Avatar initials={initials(booking.customer?.name, "CU")} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-foreground">{customerName}</h2>
              {customerPhone
                ? <p className="mt-1 text-sm text-muted-foreground"><Phone className="mr-1 inline size-3.5" />{customerPhone}</p>
                : <p className="mt-1 text-sm text-muted-foreground">Phone number was just revealed — refresh if not visible.</p>}
            </div>
            {customerPhone && <Button variant="outline" size="icon" aria-label="Call customer" onClick={() => window.alert(`Call ${customerName}: ${customerPhone}`)}><Phone /></Button>}
          </div>
          <div className="mt-5 rounded-xl bg-secondary p-4 text-sm">
            <MapPin className="mr-2 inline size-4 text-brand" />Pickup: {booking.pickup.address_text ?? `${booking.pickup.lat.toFixed(4)}, ${booking.pickup.lng.toFixed(4)}`}
          </div>
          <div className="mt-6 flex items-end justify-between border-b border-border pb-5">
            <span className="text-sm text-muted-foreground">Your earning</span>
            <span className="font-display text-2xl font-bold text-brand">{money(booking.fares.total_fare)}</span>
          </div>
          {error && <div className="mt-5"><ErrorBanner message={error} /></div>}
          <ActionButton className="mt-6" disabled={action.isPending} onClick={() => action.mutate("start")}>
            {action.isPending ? <Loader2 className="animate-spin" /> : "Start trip"}
          </ActionButton>
        </Card>
      </>
    )}

    {booking.status === "trip_started" && (
      <>
        <BackBar title="On trip" onBack={onDone} />
        <MapPlaceholder live />
        <Card className="mt-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">{title} · #{booking.id.slice(0, 8)}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-foreground">Driving {customerName}</h2>
            </div>
            <StatusBadge tone="blue">In progress</StatusBadge>
          </div>
          {booking.type === "hourly"
            ? <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">Hourly booking — end the trip when the {booking.hours} hours are up.</p>
            : <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">Drop-off: {booking.drop?.address_text ?? `${booking.drop?.lat.toFixed(4)}, ${booking.drop?.lng.toFixed(4)}`}</p>}
          <div className="mt-6 flex items-end justify-between border-b border-border pb-5">
            <span className="text-sm text-muted-foreground">Your earning</span>
            <span className="font-display text-2xl font-bold text-brand">{money(booking.fares.total_fare)}</span>
          </div>
          {error && <div className="mt-5"><ErrorBanner message={error} /></div>}
          <ActionButton className="mt-6" disabled={action.isPending} onClick={() => action.mutate("complete")}>
            {action.isPending ? <Loader2 className="animate-spin" /> : "End trip"}
          </ActionButton>
        </Card>
      </>
    )}

    {booking.status === "completed" && (
      <div className="mx-auto max-w-lg py-5 text-center">
        <span className="success-mark"><Check /></span>
        <p className="eyebrow mt-6">Trip completed</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-foreground">{money(booking.fares.total_fare)}</h1>
        <p className="mt-3 text-muted-foreground">
          {booking.payment_status === "collected"
            ? "Payment marked as collected. Great job!"
            : `Collect ${money(booking.fares.total_fare)} from ${customerName} in cash or UPI, then confirm below.`}
        </p>
        {error && <div className="mt-5"><ErrorBanner message={error} /></div>}
        {booking.payment_status === "pending" && (
          <Button size="lg" className="mt-7 w-full" disabled={action.isPending} onClick={() => action.mutate("paid")}>
            {action.isPending ? <Loader2 className="animate-spin" /> : <><Wallet /> Mark payment collected</>}
          </Button>
        )}
        <Button variant="ghost" className="mt-3 w-full" onClick={onDone}>Back to dashboard</Button>
      </div>
    )}

    {booking.status === "cancelled" && (
      <div className="mx-auto max-w-lg py-10 text-center">
        <span className="success-mark" style={{ background: "var(--destructive)", color: "white" }}><X /></span>
        <p className="eyebrow mt-6">Booking cancelled</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">This job was cancelled.</h1>
        <p className="mt-3 text-muted-foreground">It was cancelled by the {booking.cancelled_by ?? "customer"} — nothing more to do here.</p>
        <Button className="mt-8 w-full max-w-xs" onClick={onDone}>Back to dashboard</Button>
      </div>
    )}
  </div>;
}

// ---------------------------------------------------------------------------
// Verification gate, history, profile
// ---------------------------------------------------------------------------

function VerificationGate({ token, profile, onUploaded, onRecheck }: { token: string; profile: DriverProfile; onUploaded: () => void; onRecheck: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const upload = useMutation({
    mutationFn: () => driverApi.uploadDocument(token, file!),
    onSuccess: () => { setDone(true); setError(null); onUploaded(); },
    onError: (err) => setError(err instanceof Error ? err.message : "Upload failed"),
  });

  return <div className="mx-auto max-w-xl">
    <SectionHeading eyebrow="Before you can drive" title="Verify your account" />
    <Card className="p-6 sm:p-8">
      <span className={cn("icon-tile", profile.verification_status === "rejected" ? "icon-tile-red" : "icon-tile-orange")}>
        {profile.verification_status === "rejected" ? <X /> : <ShieldCheck />}
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-foreground">
        {profile.verification_status === "rejected" ? "Verification rejected" : "Verification in review"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {profile.verification_status === "rejected"
          ? "Your license document was rejected. Please upload a clear photo or scan of your driving license to try again."
          : "An admin needs to approve your license before you can go online and receive ride requests. You'll be matched with bookings as soon as that happens."}
      </p>

      {done && (
        <div className="mt-5 rounded-xl border border-chart-2/30 bg-chart-2/5 p-4 text-sm text-foreground">
          Document uploaded — an admin will review it shortly.
        </div>
      )}
      {error && <div className="mt-5"><ErrorBanner message={error} /></div>}

      <div className="mt-6">
        <label className="form-label" htmlFor="license">Driving license (image or PDF)</label>
        <input
          id="license" type="file" accept="image/*,application/pdf"
          className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
          onChange={(event) => { setFile(event.target.files?.[0] ?? null); setDone(false); }}
        />
      </div>
      <Button className="mt-5 w-full" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
        {upload.isPending ? <Loader2 className="animate-spin" /> : <><FileUp /> Upload document</>}
      </Button>
      <Button variant="outline" className="mt-3 w-full" onClick={onRecheck}>
        Check approval status
      </Button>
      {profile.license_doc_url && !done && (
        <p className="mt-3 text-xs text-muted-foreground">A document is already on file ({profile.license_doc_url}).</p>
      )}
    </Card>
  </div>;
}

function DriverHistory({ bookings, loading, onOpen }: { bookings: Booking[] | undefined; loading: boolean; onOpen: (id: string) => void }) {
  return <div className="max-w-4xl">
    <SectionHeading eyebrow="Your activity" title="Job history" />
    {loading ? <Loading /> : !bookings || bookings.length === 0 ? (
      <EmptyState icon={<RouteIcon />} title="No jobs yet" detail="Accept your first request and it will show up here." />
    ) : (
      <div className="grid gap-3 lg:grid-cols-2">
        {bookings.map((b) => <DriverBookingRow key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}
      </div>
    )}
  </div>;
}

function DriverProfileView({ token, profile, onSaved }: { token: string; profile: DriverProfile | undefined; onSaved: () => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [licenseNo, setLicenseNo] = useState(profile?.license_no ?? "");
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => driverApi.updateProfile(token, { name: name.trim(), license_no: licenseNo.trim() }),
    onSuccess: () => { setEditing(false); setError(null); onSaved(); },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
  });

  const upload = useMutation({
    mutationFn: () => driverApi.uploadDocument(token, file!),
    onSuccess: () => { setError(null); setFile(null); onSaved(); },
    onError: (err) => setError(err instanceof Error ? err.message : "Upload failed"),
  });

  return <div className="max-w-2xl">
    <SectionHeading eyebrow="Your account" title="Driver profile" />
    <Card className="p-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Avatar initials={initials(profile?.name, "DR")} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" autoFocus />
              <Input value={licenseNo} onChange={(event) => setLicenseNo(event.target.value)} placeholder="License number" />
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={save.isPending || !name.trim()} onClick={() => save.mutate()}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(profile?.name ?? ""); setLicenseNo(profile?.license_no ?? ""); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-foreground">{profile?.name ?? "Unnamed driver"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.phone ?? "—"}</p>
            </>
          )}
        </div>
        {!editing && <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setName(profile?.name ?? ""); setLicenseNo(profile?.license_no ?? ""); setEditing(true); }}>Edit</Button>}
      </div>

      <div className="grid gap-5 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Verification</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheck className={cn("size-4", profile?.is_verified ? "text-chart-2" : "text-muted-foreground")} />
            {profile ? profile.verification_status : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
            <Star className="size-4 text-highlight" />{profile && profile.rating_avg > 0 ? profile.rating_avg.toFixed(1) : "No ratings yet"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Completed trips</p>
          <p className="mt-1 font-medium text-foreground">{profile?.total_trips ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cancellations</p>
          <p className="mt-1 font-medium text-foreground">{profile?.cancellation_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">License number</p>
          <p className="mt-1 font-medium text-foreground">{profile?.license_no ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">License document</p>
          <p className="mt-1 font-medium text-foreground">{profile?.license_doc_url ? "On file" : "Not uploaded"}</p>
        </div>
      </div>

      {profile?.verification_status !== "approved" && (
        <div className="border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">License document</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload a clear photo or scan of your driving license.</p>
          <input
            type="file" accept="image/*,application/pdf" className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button className="mt-4 w-full" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <><FileUp /> Upload document</>}
          </Button>
        </div>
      )}
      {error && <div className="mt-5"><ErrorBanner message={error} /></div>}
    </Card>
  </div>;
}
