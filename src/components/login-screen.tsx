import { useState } from "react";
import { ArrowLeft, ArrowRight, CarFront, KeyRound, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand, RoleSwitcher } from "@/lib/acting-driver";
import { ApiError, authApi, type Role, type Session } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Phone + email login for customer/driver — the OTP arrives by email
 * (backend OTP_PROVIDER=email), so both fields are required on every send.
 * Admin signs in with phone + password.
 */
export function LoginScreen({ role, onLogin }: {
  role: Role;
  onLogin: (session: Session) => void;
}) {
  const isAdmin = role === "admin";
  const [phone, setPhone] = useState(role === "admin" ? "+919999999999" : "");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Client-side sanity check only — the backend does the real validation.
  const emailValid = /.+@.+\..+/.test(email.trim());

  const describe = (err: unknown) => {
    if (err instanceof ApiError) return err.message;
    return "Something went wrong. Please try again.";
  };

  const sendOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.sendOtp(phone, email);
      setDevOtp(res.otp ?? null);
      setStage("otp");
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = isAdmin
        ? await authApi.adminLogin(phone, password)
        : await authApi.verifyOtp(phone, otp, role);
      onLogin({ token: res.access_token, user: res.user });
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!isAdmin && stage === "phone") void sendOtp();
    else void verify();
  };

  const title = isAdmin
    ? "Admin sign in"
    : stage === "phone"
      ? role === "driver" ? "Drive with us" : "Welcome aboard"
      : "Enter the code";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="app-header">
        <div className="container-shell flex h-20 items-center"><Brand /></div>
      </header>
      <main className="container-shell flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="surface-card p-6 sm:p-8">
            <span className="brand-mark mx-auto flex size-14 items-center justify-center">
              {isAdmin ? <ShieldCheck className="size-6" strokeWidth={2.4} /> : <CarFront className="size-6" strokeWidth={2.4} />}
            </span>
            <p className="eyebrow mt-6 text-center">{isAdmin ? "Operations console" : `${role} account`}</p>
            <h1 className="mt-2 text-center font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {isAdmin
                ? "Use the credentials from the backend .env file."
                : stage === "phone"
                  ? "We'll email you a 4-digit verification code."
                  : `Sent to ${email}. Valid for 5 minutes.`}
            </p>

            <form className="mt-7 space-y-4" onSubmit={submit}>
              {!isAdmin && stage === "otp" && (
                <div>
                  <label className="form-label" htmlFor="otp">Verification code</label>
                  <div className="relative">
                    <KeyRound className="input-icon text-muted-foreground" />
                    <Input
                      id="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={4}
                      placeholder="1234"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                      className="h-12 pl-10 tracking-[0.4em]"
                      autoFocus
                    />
                  </div>
                  {devOtp && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Dev mode — OTP for this session: <strong className="text-foreground">{devOtp}</strong>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="form-label" htmlFor="phone">{isAdmin ? "Phone" : "Phone number"}</label>
                <div className="relative">
                  <Phone className="input-icon text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-12 pl-10"
                    disabled={!isAdmin && stage === "otp"}
                  />
                </div>
              </div>

              {!isAdmin && (
                <div>
                  <label className="form-label" htmlFor="email">Email address</label>
                  <div className="relative">
                    <Mail className="input-icon text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 pl-10"
                      disabled={stage === "otp"}
                    />
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="relative">
                    <KeyRound className="input-icon text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full justify-between rounded-xl px-5" disabled={busy || (!isAdmin && stage === "phone" && (phone.trim().length < 8 || !emailValid)) || (isAdmin && !password)}>
                {busy ? <Loader2 className="animate-spin" /> : <span>Continue</span>}
                <ArrowRight />
              </Button>

              {!isAdmin && stage === "otp" && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setStage("phone"); setOtp(""); setDevOtp(null); setError(null); }}>
                  <ArrowLeft /> Change number or email
                </Button>
              )}
            </form>
          </div>

          <div className="mt-8 flex justify-center">
            <div className={cn("flex justify-center")}>
              <RoleSwitcher active={role} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
