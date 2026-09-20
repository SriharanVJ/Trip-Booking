// Customer workspace — booking progress arrives over WebSocket; lists refresh
// on socket events, own actions and reconnects. No polling anywhere.
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, CarFront, Check, Clock3, Loader2, MapPin, Phone,
  Route as RouteIcon, ShieldCheck, Star, Wallet, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginScreen } from "@/components/login-screen";
import {
  ActionButton, AppHeader, Avatar, BackBar, Card, EmptyState, ErrorBanner,
  FareBreakdown, IconTile, InfoBanner, Loading, MapPlaceholder, MobileNav,
  RoleSwitcher, SectionHeading, StatusBadge,
} from "@/lib/acting-driver";
import { useSession } from "@/lib/auth";
import { useRealtime } from "@/hooks/use-realtime";
import {
  ACTIVE_STATUSES, DEMO_PLACES, STATUS_META, customerApi, getCurrentPosition, km, money,
  type Booking, type Session,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function CustomerApp() {
  const { session, ready, login, logout } = useSession("customer");
  if (!ready) return null;
  if (!session) return <LoginScreen role="customer" onLogin={login} />;
  return <CustomerWorkspace session={session} onLogout={logout} />;
}

type View = "home" | "location" | "hours" | "history" | "profile";

function CustomerWorkspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { token, user } = session;
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  // Bookings the user deliberately closed from the trip screen — don't auto-resume them.
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const profile = useQuery({
    queryKey: ["customer-profile", user.id],
    queryFn: () => customerApi.profile(token),
  });

  const history = useQuery({
    queryKey: ["customer-bookings", user.id],
    queryFn: () => customerApi.bookings(token),
  });

  const booking = useQuery({
    queryKey: ["booking", activeId],
    queryFn: () => customerApi.booking(token, activeId!),
    enabled: activeId != null,
  });

  // Resume an in-flight booking after a refresh.
  const liveBooking = history.data?.bookings.find(
    (b) => ACTIVE_STATUSES.includes(b.status) && !dismissed.includes(b.id),
  );
  useEffect(() => {
    if (activeId || !liveBooking) return;
    setActiveId(liveBooking.id);
  }, [activeId, liveBooking]);

  const connected = useRealtime({
    role: "customer", userId: user.id, token,
    onEvent: (event, data) => {
      // Each branch only reacts to its own event name — GPS frames and
      // keep-alive pongs never trigger refetches.
      if (event === "booking:accepted") {
        const payload = data["booking"] as Booking | undefined;
        if (payload) {
          setActiveId(payload.id);
          setDriverPos(null);
          setBanner(null);
          void queryClient.invalidateQueries({ queryKey: ["booking", payload.id] });
          void queryClient.invalidateQueries({ queryKey: ["customer-bookings", user.id] });
          void queryClient.invalidateQueries({ queryKey: ["customer-profile", user.id] });
        }
        return;
      }
      if (event === "driver:location_update") {
        setDriverPos({ lat: Number(data["lat"]), lng: Number(data["lng"]) });
        return;
      }
      if (event === "booking:no_drivers") {
        setBanner("No drivers responded in your area. You can keep waiting, cancel for free, or book again.");
        return;
      }
      if (event === "booking:cancelled" || event === "booking:status_update") {
        const bookingId = data["booking_id"] as string | undefined;
        if (event === "booking:cancelled" && data["message"]) {
          setBanner(String(data["message"]));
        }
        if (bookingId) {
          void queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
          void queryClient.invalidateQueries({ queryKey: ["customer-bookings", user.id] });
        }
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
      void queryClient.invalidateQueries({ queryKey: ["customer-profile", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["customer-bookings", user.id] });
      if (activeId) void queryClient.invalidateQueries({ queryKey: ["booking", activeId] });
    }
    wasConnected.current = true;
  }, [connected, user.id, activeId, queryClient]);

  const frame = (children: React.ReactNode, activeView: string = view) => (
    <div className="min-h-screen bg-background">
      <AppHeader role="customer" name={profile.data?.name ?? user.name} onLogout={onLogout} />
      <main className="container-shell pb-28 pt-8 lg:pb-12">{children}</main>
      <MobileNav view={activeView} setView={(next) => { setBanner(null); setActiveId(null); setView(next as View); }} />
    </div>
  );

  const startBooking = (id: string) => {
    setActiveId(id);
    void queryClient.invalidateQueries({ queryKey: ["customer-bookings", user.id] });
  };
  const exitBooking = () => {
    if (activeId) setDismissed((prev) => [...prev, activeId]);
    setActiveId(null);
    setBanner(null);
    setView("home");
  };

  // Active booking takes over the screen
  if (activeId) {
    if (booking.isLoading) return frame(<Loading label="Loading your booking…" />);
    if (booking.isError) {
      return frame(
        <div className="mx-auto max-w-lg">
          <ErrorBanner message="Could not load this booking. It may belong to another account." />
          <Button variant="outline" className="w-full" onClick={exitBooking}>Back to home</Button>
        </div>,
      );
    }
    if (booking.data) {
      return frame(<BookingFlow token={token} booking={booking.data} driverPos={driverPos} banner={banner} onCloseBanner={() => setBanner(null)} onExit={exitBooking} />);
    }
  }

  if (view === "location") return frame(<LocationBooking token={token} activeId={activeId} onStart={startBooking} onBack={() => setView("home")} />);
  if (view === "hours") return frame(<HourlyBooking token={token} onStart={startBooking} onBack={() => setView("home")} />);
  if (view === "history") return frame(<BookingHistory token={token} bookings={history.data?.bookings} onOpen={setActiveId} />);
  if (view === "profile") return frame(<CustomerProfile token={token} profile={profile.data} onSaved={() => void queryClient.invalidateQueries({ queryKey: ["customer-profile", user.id] })} />);

  return frame(
    <CustomerHome
      name={profile.data?.name ?? user.name}
      dues={profile.data?.pending_dues ?? 0}
      recent={history.data?.bookings.slice(0, 3)}
      loadingHistory={history.isLoading}
      onLocation={() => setView("location")}
      onHours={() => setView("hours")}
      onHistory={() => setView("history")}
      onOpen={(id) => setActiveId(id)}
      liveId={liveBooking?.id ?? null}
    />,
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function CustomerHome({ name, dues, recent, loadingHistory, liveId, onLocation, onHours, onHistory, onOpen }: {
  name: string | null; dues: number; recent: Booking[] | undefined; loadingHistory: boolean; liveId: string | null;
  onLocation: () => void; onHours: () => void; onHistory: () => void; onOpen: (id: string) => void;
}) {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return <div className="max-w-5xl">
    <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className="eyebrow mb-3">{today}</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{greeting}, {name ?? "there"}<span className="text-brand">.</span></h1>
        <p className="mt-3 max-w-md text-muted-foreground">Where would you like your driver to take you today?</p>
      </div>
      <RoleSwitcher active="customer" />
    </div>

    {liveId && (
      <div className="mb-6">
        <InfoBanner>
          <div className="flex items-center justify-between gap-4">
            <span>You have an ongoing booking.</span>
            <Button size="sm" onClick={() => onOpen(liveId)}>Open</Button>
          </div>
        </InfoBanner>
      </div>
    )}
    {dues > 0 && (
      <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <Wallet className="mr-2 inline size-4" />You have <strong>{money(dues)} pending</strong> in cancellation fees. Clear them with your driver or admin before your next trip.
      </div>
    )}

    <section>
      <SectionHeading eyebrow="Your next ride" title="Book a driver" />
      <div className="grid gap-4 md:grid-cols-2">
        <button className="booking-choice booking-choice-primary" onClick={onLocation}>
          <span className="booking-choice-top"><IconTile><MapPin /></IconTile><ArrowRight className="booking-arrow" /></span>
          <span className="mt-8 block text-left"><strong>Book by location</strong><small>Point A to point B, on your schedule.</small></span>
        </button>
        <button className="booking-choice booking-choice-secondary" onClick={onHours}>
          <span className="booking-choice-top"><IconTile tone="orange"><Clock3 /></IconTile><ArrowRight className="booking-arrow" /></span>
          <span className="mt-8 block text-left"><strong>Book by hours</strong><small>Keep a driver with you for the day.</small></span>
        </button>
      </div>
    </section>

    <section className="mt-12">
      <SectionHeading eyebrow="Your activity" title="Recent bookings" action={<Button variant="ghost" onClick={onHistory}>View all <ArrowRight /></Button>} />
      {loadingHistory ? <Loading /> : recent && recent.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">{recent.map((b) => <BookingCard key={b.id} booking={b} onOpen={() => onOpen(b.id)} />)}</div>
      ) : (
        <EmptyState icon={<RouteIcon />} title="No trips yet" detail="Book your first driver and it will show up here." />
      )}
    </section>

    <div className="mt-12 rounded-2xl bg-ink p-6 text-ink-foreground sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow eyebrow-light">Always included</p>
          <h3 className="mt-2 font-display text-2xl font-bold">Your car. Your comfort. <span className="text-highlight">Our driver.</span></h3>
          <p className="mt-2 max-w-lg text-sm text-ink-muted">Pay directly to your verified driver by cash or UPI after your trip.</p>
        </div>
        <ShieldCheck className="hidden size-12 text-highlight sm:block" />
      </div>
    </div>
  </div>;
}

export function BookingCard({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const meta = STATUS_META[booking.status];
  const title = booking.type === "hourly"
    ? `${booking.hours} hour booking`
    : `${booking.pickup.address_text ?? "Pickup"} → ${booking.drop?.address_text ?? "Drop"}`;
  return (
    <Card className="cursor-pointer p-4 transition hover:shadow-md" >
      <button className="w-full text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <IconTile tone={booking.type === "hourly" ? "orange" : "blue"}>{booking.type === "hourly" ? <Clock3 /> : <RouteIcon />}</IconTile>
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
        <h3 className="mt-5 truncate font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{fmtStamp(booking)}</p>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{booking.driver?.name ?? "Driver pending"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{booking.payment_status === "collected" ? "Paid" : "Payment pending"} · #{booking.id.slice(0, 8)}</p>
          </div>
          <span className="font-display text-xl font-bold text-foreground">{booking.fares.total_fare != null ? money(booking.fares.total_fare) : "—"}</span>
        </div>
      </button>
    </Card>
  );
}

function fmtStamp(booking: Booking): string {
  const iso = booking.completed_at ?? booking.cancelled_at ?? booking.started_at ?? booking.assigned_at ?? booking.requested_at;
  if (!iso) return "—";
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

// ---------------------------------------------------------------------------
// Booking forms
// ---------------------------------------------------------------------------

const DEFAULT_PICKUP = { name: "Koramangala, 4th Block", lat: 12.9352, lng: 77.6245 };

function useEstimate(token: string, params: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: ["fare-estimate", params],
    queryFn: () => customerApi.fareEstimate(token, params as Parameters<typeof customerApi.fareEstimate>[1]),
    enabled,
    staleTime: 30_000,
  });
}

function LocationBooking({ token, activeId, onStart, onBack }: {
  token: string; activeId: string | null; onStart: (id: string) => void; onBack: () => void;
}) {
  const [pickup, setPickup] = useState(DEFAULT_PICKUP);
  const [pickupLabel, setPickupLabel] = useState(DEFAULT_PICKUP.name);
  const [drop, setDrop] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dropPlace = DEMO_DROP(drop);
  const estimate = useEstimate(token, {
    type: "location", pickup_lat: pickup.lat, pickup_lng: pickup.lng,
    ...(dropPlace ? { drop_lat: dropPlace.lat, drop_lng: dropPlace.lng } : {}),
  }, !!dropPlace);

  const create = useMutation({
    mutationFn: () => customerApi.createBooking(token, {
      type: "location",
      pickup_lat: pickup.lat, pickup_lng: pickup.lng, pickup_address_text: pickupLabel,
      drop_lat: dropPlace!.lat, drop_lng: dropPlace!.lng, drop_address_text: dropPlace!.name,
    }),
    onSuccess: (res) => onStart(res.booking.id),
    onError: (err) => setError(err instanceof Error ? err.message : "Could not create the booking"),
  });

  const useCurrent = async () => {
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPickup({ name: "Current location", lat: pos.coords.latitude, lng: pos.coords.longitude });
      setPickupLabel("Current location");
    } catch (err) {
      setError(err instanceof Error ? `Location access failed: ${err.message}` : "Location access failed");
    }
  };

  return <div className="max-w-3xl">
    <BackBar title="Book by location" onBack={onBack} />
    <MapPlaceholder />
    <Card className="mt-5 p-5 sm:p-7">
      <div className="space-y-5">
        <div>
          <label className="form-label" htmlFor="pickup">Pickup location</label>
          <div className="relative">
            <MapPin className="input-icon text-brand" />
            <Input id="pickup" value={pickupLabel} onChange={(event) => setPickupLabel(event.target.value)} className="h-12 pl-10 pr-28" />
            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 text-brand" onClick={useCurrent}>Use current</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Coords sent: {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}</p>
        </div>
        <div>
          <label className="form-label" htmlFor="drop">Drop location</label>
          <select id="drop" className="select-control h-12" value={drop} onChange={(event) => setDrop(event.target.value)}>
            <option value="">Choose a destination…</option>
            {DEMO_PLACES.map((place) => <option key={place.name} value={place.name}>{place.name}</option>)}
          </select>
        </div>

        {error && <ErrorBanner message={error} />}
        {activeId && <InfoBanner>You already have a booking in progress — creating a new one will run both searches.</InfoBanner>}

        <div className="rounded-xl bg-secondary p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated distance</span>
            <span className="font-semibold text-foreground">{estimate.isLoading ? "…" : km(estimate.data?.trip_distance_km)}</span>
          </div>
        </div>

        {estimate.data && (
          <FareBreakdown
            rows={[
              { label: `Base fare · ${km(estimate.data.trip_distance_km)}`, value: money(estimate.data.base_fare) },
              { label: `Pickup charge (first ${km(estimate.data.pickup_charge.free_km_limit)} free, then ${money(estimate.data.pickup_charge.per_km_beyond_limit)}/km)`, value: "after driver accepts" },
            ]}
            total={money(estimate.data.estimated_total_fare)}
          />
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          <Zap className="mr-1 inline size-3 text-highlight" />Final fare is confirmed when a driver accepts and their pickup distance is known.
        </p>

        <ActionButton disabled={!dropPlace || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? <Loader2 className="animate-spin" /> : "Find a driver"}
        </ActionButton>
      </div>
    </Card>
  </div>;
}

function HourlyBooking({ token, onStart, onBack }: {
  token: string; onStart: (id: string) => void; onBack: () => void;
}) {
  const [hours, setHours] = useState(4);
  const [pickup, setPickup] = useState(DEFAULT_PICKUP);
  const [pickupLabel, setPickupLabel] = useState(DEFAULT_PICKUP.name);
  const [error, setError] = useState<string | null>(null);

  const estimate = useEstimate(token, { type: "hourly", pickup_lat: pickup.lat, pickup_lng: pickup.lng, hours }, true);

  const create = useMutation({
    mutationFn: () => customerApi.createBooking(token, {
      type: "hourly", hours,
      pickup_lat: pickup.lat, pickup_lng: pickup.lng, pickup_address_text: pickupLabel,
    }),
    onSuccess: (res) => onStart(res.booking.id),
    onError: (err) => setError(err instanceof Error ? err.message : "Could not create the booking"),
  });

  const useCurrent = async () => {
    try {
      const pos = await getCurrentPosition();
      setPickup({ name: "Current location", lat: pos.coords.latitude, lng: pos.coords.longitude });
      setPickupLabel("Current location");
    } catch {
      // keep the demo pickup — coords are always valid either way
    }
  };

  const options = [2, 4, 6, 8, 12];
  return <div className="max-w-3xl">
    <BackBar title="Book by hours" onBack={onBack} />
    <Card className="p-5 sm:p-7">
      <p className="eyebrow mb-3">Flexible booking</p>
      <h2 className="font-display text-2xl font-bold text-foreground">How long will you need a driver?</h2>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {options.map((option) => (
          <button key={option} onClick={() => setHours(option)} className={cn("duration-option", hours === option && "duration-option-active")}>
            <strong>{option}</strong><small>hours</small>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <label className="form-label" htmlFor="hourly-pickup">Pickup location</label>
        <div className="relative">
          <MapPin className="input-icon text-brand" />
          <Input id="hourly-pickup" value={pickupLabel} onChange={(event) => setPickupLabel(event.target.value)} className="h-12 pl-10 pr-28" />
          <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 text-brand" onClick={useCurrent}>Use current</Button>
        </div>
      </div>

      {error && <div className="mt-5"><ErrorBanner message={error} /></div>}

      <div className="my-8 border-t border-border" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{hours} hour booking</p>
          <p className="mt-1 text-xs text-muted-foreground">Driver comes to your pickup point</p>
        </div>
        <span className="font-display text-3xl font-bold text-brand">{estimate.data ? money(estimate.data.estimated_total_fare) : "…"}</span>
      </div>
      {estimate.data && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          <Zap className="mr-1 inline size-3 text-highlight" />{money(estimate.data.base_fare)} base ({hours} h) + pickup charge beyond the first {km(estimate.data.pickup_charge.free_km_limit)}, added when a driver accepts.
        </p>
      )}
      <ActionButton className="mt-6" disabled={create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? <Loader2 className="animate-spin" /> : "Find a driver"}
      </ActionButton>
    </Card>
  </div>;
}

// ---------------------------------------------------------------------------
// Booking lifecycle
// ---------------------------------------------------------------------------

function BookingFlow({ token, booking, driverPos, banner, onCloseBanner, onExit }: {
  token: string; booking: Booking; driverPos: { lat: number; lng: number } | null;
  banner: string | null; onCloseBanner: () => void; onExit: () => void;
}) {
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const cancel = useMutation({
    mutationFn: () => customerApi.cancelBooking(token, booking.id),
    onSuccess: () => {
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
    },
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
  const searching = booking.status === "requested" || booking.status === "searching";

  return <div className="max-w-4xl">
    {banner && (
      <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm text-foreground">
        <span>{banner}</span>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCloseBanner} aria-label="Dismiss"><X className="size-4" /></Button>
      </div>
    )}
    {searching && <FindingDriver booking={booking} onCancel={() => setCancelOpen(true)} onRefresh={refresh} />}
    {booking.status === "driver_assigned" && <Assigned booking={booking} onExit={onExit} onCancel={() => setCancelOpen(true)} />}
    {booking.status === "trip_started" && <TripInProgress booking={booking} driverPos={driverPos} />}
    {booking.status === "completed" && <TripCompleted token={token} booking={booking} onDone={onExit} />}
    {booking.status === "cancelled" && <CancelledNotice booking={booking} onDone={onExit} />}

    {cancelOpen && (
      <CancelModal
        booking={booking}
        busy={cancel.isPending}
        fee={cancel.data?.cancellation_fee}
        feeApplied={cancel.data?.fee_applied}
        error={cancel.error instanceof Error ? cancel.error.message : null}
        onClose={() => { setCancelOpen(false); cancel.reset(); }}
        onConfirm={() => cancel.mutate()}
      />
    )}
  </div>;
}

function FindingDriver({ booking, onCancel, onRefresh }: { booking: Booking; onCancel: () => void; onRefresh: () => void }) {
  return <div className="mx-auto max-w-md py-10 text-center">
    <div className="radar-wrap"><div className="radar-ring radar-ring-one" /><div className="radar-ring radar-ring-two" /><span className="radar-center"><CarFront /></span></div>
    <p className="eyebrow mt-12">Just a moment</p>
    <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Looking for nearby drivers</h1>
    <p className="mt-3 text-muted-foreground">
      We're notifying verified drivers around {booking.pickup.address_text ?? "your pickup point"} in expanding circles.
    </p>
    <div className="mt-6 grid gap-2">
      <Button variant="outline" onClick={onRefresh}>Refresh status</Button>
      <Button variant="ghost" onClick={onCancel}>Cancel search</Button>
    </div>
  </div>;
}

function Assigned({ booking, onExit, onCancel }: { booking: Booking; onExit: () => void; onCancel: () => void }) {
  const driver = booking.driver;
  return <div className="max-w-3xl">
    <BackBar title="Driver assigned" onBack={onExit} />
    <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-brand">
      <span className="status-dot" /> Driver is {km(booking.pickup_distance_km)} away — heading to your pickup point
    </div>
    <MapPlaceholder compact />
    <Card className="mt-5 p-5">
      <Card className="flex items-center gap-4 border-0 p-0 shadow-none">
        <Avatar initials={(driver?.name ?? "DR").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="font-semibold text-foreground">{driver?.name ?? "Your driver"}</h3><ShieldCheck className="size-4 text-brand" /></div>
          <p className="mt-1 text-xs text-muted-foreground">{driver?.rating_avg?.toFixed(1) ?? "—"} rating · {driver?.total_trips ?? 0} trips</p>
        </div>
        <Button variant="outline" size="icon" aria-label="Call driver" onClick={() => driver?.phone && window.alert(`Call ${driver.name}: ${driver.phone}`)}><Phone /></Button>
      </Card>
      <div className="mt-5 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
        <Phone className="mr-2 inline size-4" />{driver?.phone ? `Call ${driver.name} at ${driver.phone} to confirm the exact pickup spot.` : "Your driver will call shortly to confirm the pickup."}
      </div>
      <div className="mt-5 flex items-end justify-between border-b border-border pb-5">
        <div>
          <p className="text-xs text-muted-foreground">Final fare (incl. pickup charge)</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{money(booking.fares.total_fare)}</p>
        </div>
        <span className="text-xs text-muted-foreground">Pay in person · Cash/UPI</span>
      </div>
      <Button variant="ghost" className="mt-5 w-full text-destructive" onClick={onCancel}><X /> Cancel booking</Button>
    </Card>
  </div>;
}

function TripInProgress({ booking, driverPos }: { booking: Booking; driverPos: { lat: number; lng: number } | null }) {
  const current = ["requested", "searching"].includes(booking.status) ? 0
    : booking.status === "driver_assigned" ? 1
    : booking.status === "trip_started" ? 2 : 3;
  return <div className="max-w-4xl">
    <div className="mb-8 flex items-center justify-between">
      <div>
        <p className="eyebrow">Booking #{booking.id.slice(0, 8)}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Your trip is underway</h1>
      </div>
      <StatusBadge tone="blue">In progress</StatusBadge>
    </div>
    <div className="status-stepper">
      {["Requested", "Driver assigned", "Trip started", "Completed"].map((label, index) => (
        <div key={label} className={cn("step", index < current && "step-done", index === current && "step-current")}>
          <span>{index < current ? <Check /> : index === current ? <CarFront /> : index + 1}</span><small>{label}</small>
        </div>
      ))}
    </div>
    <MapPlaceholder live />
    {driverPos && (
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
        <span className="status-dot" /> Live driver position: {driverPos.lat.toFixed(4)}, {driverPos.lng.toFixed(4)}
      </div>
    )}
    <Card className="mt-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar initials={(booking.driver?.name ?? "DR").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} />
          <div>
            <p className="font-semibold text-foreground">{booking.driver?.name ?? "Your driver"}</p>
            <p className="text-sm text-muted-foreground">{booking.started_at ? `Trip started at ${new Date(booking.started_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "On the way"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Fare</p>
          <p className="font-display text-2xl font-bold text-brand">{money(booking.fares.total_fare)}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">The driver ends the trip from their app — this screen updates automatically.</p>
    </Card>
  </div>;
}

function TripCompleted({ token, booking, onDone }: { token: string; booking: Booking; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(booking.rating?.rating ?? 0);
  const [review, setReview] = useState(booking.rating?.review_text ?? "");

  const rate = useMutation({
    mutationFn: () => customerApi.rateBooking(token, booking.id, rating, review.trim() || undefined),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["booking", booking.id] }),
  });

  return <div className="mx-auto max-w-lg py-5 text-center">
    <span className="success-mark"><Check /></span>
    <p className="eyebrow mt-6">Trip completed</p>
    <h1 className="mt-2 font-display text-4xl font-bold text-foreground">Thanks for riding with us.</h1>
    <p className="mt-3 text-muted-foreground">Your driver made it happen. Please settle the fare directly.</p>
    <Card className="mt-8 p-6 text-left">
      <p className="text-sm text-muted-foreground">Final fare</p>
      <p className="mt-1 font-display text-4xl font-bold text-brand">{money(booking.fares.total_fare)}</p>
      <div className="my-5 border-t border-border" />
      <FareBreakdown
        totalLabel={booking.payment_status === "collected" ? "Paid" : "Due in person"}
        total={money(booking.fares.total_fare)}
        rows={[
          { label: "Base fare", value: money(booking.fares.base_fare) },
          { label: "Pickup charge", value: money(booking.fares.pickup_charge) },
        ]}
      />
      <div className="mt-5 rounded-xl bg-highlight-soft p-4 text-sm font-semibold text-highlight-foreground">
        {booking.payment_status === "collected"
          ? "Payment received — you're all set!"
          : `Please pay ${money(booking.fares.total_fare)} directly to the driver`}
        <span className="mt-1 block text-xs font-normal">Cash / UPI accepted</span>
      </div>
    </Card>

    {booking.rating ? (
      <p className="mt-7 text-sm text-muted-foreground">You rated this trip {booking.rating.rating} ★ — thank you!</p>
    ) : (
      <div className="mt-7">
        <p className="text-sm font-semibold text-foreground">How was your ride?</p>
        <div className="mt-3 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} onClick={() => setRating(value)} aria-label={`${value} stars`}>
              <Star className={cn("size-8", value <= rating ? "fill-highlight text-highlight" : "text-border")} />
            </button>
          ))}
        </div>
        <Input placeholder="Optional review…" value={review} onChange={(event) => setReview(event.target.value)} className="mt-4" maxLength={1000} />
        {rate.error && <p className="mt-2 text-xs text-destructive">{rate.error.message}</p>}
        <Button size="lg" className="mt-5 w-full" disabled={rating < 1 || rate.isPending} onClick={() => rate.mutate()}>
          {rate.isPending ? <Loader2 className="animate-spin" /> : "Submit rating"}
        </Button>
      </div>
    )}
    <Button variant="ghost" className="mt-4 w-full" onClick={onDone}>Back to home</Button>
  </div>;
}

function CancelledNotice({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const fee = booking.fares.cancellation_fee ?? 0;
  return <div className="mx-auto max-w-lg py-10 text-center">
    <span className="success-mark" style={{ background: "var(--destructive)", color: "white" }}><X /></span>
    <p className="eyebrow mt-6">Booking cancelled</p>
    <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
      Cancelled by {booking.cancelled_by ?? "you"}.
    </h1>
    {fee > 0
      ? <p className="mt-3 text-muted-foreground">A cancellation fee of <strong className="text-foreground">{money(fee)}</strong> was added to your dues.</p>
      : <p className="mt-3 text-muted-foreground">No fees were charged for this cancellation.</p>}
    <Button className="mt-8 w-full max-w-xs" onClick={onDone}>Book a new ride</Button>
  </div>;
}

function CancelModal({ booking, busy, fee, feeApplied, error, onClose, onConfirm }: {
  booking: Booking; busy: boolean; fee: number | undefined; feeApplied: boolean | undefined; error: string | null;
  onClose: () => void; onConfirm: () => void;
}) {
  const assigned = booking.status === "driver_assigned" || booking.status === "trip_started";
  const estimateFee = booking.fares.total_fare != null ? booking.fares.total_fare * 0.15 : null;
  return <div className="modal-backdrop">
    <div className="modal-sheet">
      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
      <h2 className="font-display text-2xl font-bold text-foreground">Cancel this booking?</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {feeApplied
          ? `Cancelled. A fee of ${money(fee)} was added to your dues.`
          : assigned
            ? <>A driver was already assigned — cancelling now adds a 15% fee of <strong className="text-foreground">{estimateFee != null ? money(estimateFee) : "the fare"}</strong> to your dues.</>
            : <>No driver has been assigned yet, so cancelling now is <strong className="text-foreground">free</strong>.</>}
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-7 grid gap-3">
        <Button variant="destructive" disabled={busy} onClick={onConfirm}>
          {busy ? <Loader2 className="animate-spin" /> : "Confirm cancellation"}
        </Button>
        <Button variant="outline" onClick={onClose}>Go back</Button>
      </div>
    </div>
  </div>;
}

// ---------------------------------------------------------------------------
// History & profile
// ---------------------------------------------------------------------------

function BookingHistory({ token, bookings, onOpen }: {
  token: string; bookings: Booking[] | undefined; onOpen: (id: string) => void;
}) {
  const dues = useQuery({ queryKey: ["customer-dues", token], queryFn: () => customerApi.dues(token) });
  return <div className="max-w-4xl">
    <SectionHeading eyebrow="Your activity" title="Booking history" />
    {dues.data?.has_dues && (
      <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <Wallet className="mr-2 inline size-4" />You have <strong>{money(dues.data.pending_dues)} pending</strong> from previous cancellations.
      </div>
    )}
    {!bookings ? <Loading /> : bookings.length === 0 ? (
      <EmptyState icon={<RouteIcon />} title="No bookings yet" detail="Your rides will appear here once you book." />
    ) : (
      <div className="space-y-3">
        {bookings.map((booking) => {
          const meta = STATUS_META[booking.status];
          const title = booking.type === "hourly"
            ? `${booking.hours} hour booking`
            : `${booking.pickup.address_text ?? "Pickup"} → ${booking.drop?.address_text ?? "Drop"}`;
          return (
            <Card key={booking.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <button className="flex items-center gap-4 text-left" onClick={() => onOpen(booking.id)}>
                  <IconTile tone={booking.type === "hourly" ? "orange" : "blue"}>{booking.type === "hourly" ? <Clock3 /> : <RouteIcon />}</IconTile>
                  <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{fmtStamp(booking)} · {booking.driver?.name ?? "No driver"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">#{booking.id.slice(0, 8)}</p>
                  </div>
                </button>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-foreground">{booking.fares.total_fare != null ? money(booking.fares.total_fare) : "—"}</p>
                    <p className="text-xs text-muted-foreground">{booking.payment_status === "collected" ? "Paid" : "Payment pending"}</p>
                  </div>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </div>;
}

function CustomerProfile({ token, profile, onSaved }: {
  token: string; profile: { user_id: string; phone: string; name: string | null; pending_dues: number; member_since?: string | null } | undefined;
  onSaved: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [editing, setEditing] = useState(false);
  const save = useMutation({
    mutationFn: () => customerApi.updateProfile(token, name.trim()),
    onSuccess: () => { setEditing(false); onSaved(); },
  });

  return <div className="max-w-2xl">
    <SectionHeading eyebrow="Your account" title="Profile" />
    <Card className="p-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Avatar initials={(profile?.name ?? "CU").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} className="h-10" autoFocus />
              <Button size="sm" disabled={save.isPending || !name.trim()} onClick={() => save.mutate()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(profile?.name ?? ""); }}>Cancel</Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-foreground">{profile?.name ?? "Unnamed customer"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.phone ?? "—"}</p>
            </>
          )}
        </div>
        {!editing && <Button variant="outline" size="sm" className="ml-auto" onClick={() => setEditing(true)}>Edit</Button>}
      </div>
      <div className="grid gap-5 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Preferred payment</p>
          <p className="mt-1 font-medium text-foreground">Cash / UPI to driver</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pending dues</p>
          <p className={cn("mt-1 font-medium", (profile?.pending_dues ?? 0) > 0 ? "text-destructive" : "text-foreground")}>
            {profile ? money(profile.pending_dues) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Member since</p>
          <p className="mt-1 font-medium text-foreground">
            {profile?.member_since ? new Date(profile.member_since).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>
      {save.error && <ErrorBanner message={save.error.message} />}
    </Card>
  </div>;
}

function DEMO_DROP(name: string) {
  return DEMO_PLACES.find((place) => place.name === name) ?? null;
}
