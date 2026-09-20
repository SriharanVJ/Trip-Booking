import { useCallback, useEffect, useState } from "react";
import { loadSession, storeSession, type Role, type Session } from "@/lib/api";

/**
 * Per-role session state. Tokens live in localStorage under one key per role,
 * so the same browser can act as customer, driver and admin at once — which is
 * exactly what you want when smoke-testing the whole flow solo.
 */
export function useSession(role: Role) {
  const [session, setSession] = useState<Session | null>(null);
  // SSR renders before effects run; callers gate on `ready` to avoid hydration mismatches.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadSession(role));
    setReady(true);
  }, [role]);

  const login = useCallback((next: Session) => {
    storeSession(role, next);
    setSession(next);
  }, [role]);

  const logout = useCallback(() => {
    storeSession(role, null);
    setSession(null);
  }, [role]);

  return { session, ready, login, logout };
}
