// Compatibility shims so code written against next/navigation keeps working
// inside this TanStack Start app. Every hook resolves against the real router,
// and absolute app paths are automatically namespaced under /travels.
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams as useRouterParams } from "@tanstack/react-router";

/** Prefix an app-relative path with /travels (leaves external/other-app paths alone). */
export function travelsHref(path: string): string {
  if (!path.startsWith("/")) return path;
  if (path === "/travels" || path.startsWith("/travels/") || path.startsWith("/driver")) {
    return path;
  }
  return `/travels${path === "/" ? "" : path}`;
}

/**
 * Escape hatch for Link `to` values pointing at routes that don't exist in the
 * merged tree — they didn't exist in the original app either (about, contact,
 * faq, terms, privacy, refund, admin reports / detail views), so these remain
 * dead links that render the not-found page, exactly as upstream did. The
 * cast keeps them out of the typed route union without changing runtime
 * behaviour.
 */
export function deadRoute(path: string): never {
  return path as never;
}

/** useRouter(): push/replace/back/prefetch — the subset the travels app uses. */
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (path: string) => navigate({ to: travelsHref(path) }),
      replace: (path: string) => navigate({ to: travelsHref(path), replace: true }),
      back: () => window.history.back(),
      prefetch: () => {
        /* TanStack Link components prefetch automatically; no-op here */
      },
    }),
    [navigate],
  );
}

/** usePathname(): pathname without the /travels prefix, matching the original routes. */
export function usePathname(): string {
  const location = useLocation();
  const raw = location.pathname;
  if (raw === "/travels") return "/";
  if (raw.startsWith("/travels/")) return raw.slice("/travels".length);
  return raw;
}

/** useSearchParams(): URLSearchParams of the current query string. */
export function useSearchParams(): URLSearchParams {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

/**
 * useParams(): merged params for the current match. Travels pages expect
 * plain strings (Next.js dynamic segments), e.g. `/travels/book/[vehicleId]`.
 */
export function useParams(): Record<string, string> {
  // strict:false — merged params across all matches, no route-context
  // inference required (works from any component inside the router tree).
  const params = useRouterParams({ strict: false });
  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value != null) out[key] = String(value);
    }
    return out;
  }, [params]);
}

/** Stable callback helper mirroring next/navigation's expectation-free usage. */
export function useTravelsNavigate() {
  const router = useRouter();
  return useCallback((path: string) => router.push(path), [router]);
}
