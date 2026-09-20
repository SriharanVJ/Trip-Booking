// Radix portals render into document.body by default, which would land
// outside the .travels-root scope and miss the travels styling. This helper
// returns the travels root element so portals stay inside it.
// Falls back to undefined (Radix's default) during SSR or if the root is
// not yet mounted.
export function travelsPortalContainer(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return (document.querySelector(".travels-root") as HTMLElement | null) ?? undefined;
}
