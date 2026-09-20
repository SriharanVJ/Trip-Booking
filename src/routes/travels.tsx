import { Outlet, createFileRoute } from "@tanstack/react-router";

import travelsCss from "../travels/travels.css?url";
import { Header } from "@travels/components/layout/header";
import { Footer } from "@travels/components/layout/footer";

/**
 * Book Travels layout. The `.travels-root` class scopes every token and
 * override in travels.css to this subtree, and the stylesheet link below is
 * route-scoped (TanStack Start removes it once no /travels route matches),
 * so the driver app and landing page are unaffected by this app's styling.
 */
export const Route = createFileRoute("/travels")({
  head: () => ({
    meta: [
      { title: "AJ Holidays | Luxury Travel & Vehicle Booking" },
      {
        name: "description",
        content:
          "Rent premium cars, travellers, coaches and buses with transparent pricing and instant booking.",
      },
      { property: "og:title", content: "AJ Holidays | Luxury Travel & Vehicle Booking" },
      {
        property: "og:description",
        content:
          "Rent premium cars, travellers, coaches and buses with transparent pricing and instant booking.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap",
      },
      { rel: "stylesheet", href: travelsCss },
    ],
  }),
  component: TravelsLayout,
});

function TravelsLayout() {
  return (
    <div className="travels-root flex flex-col min-h-screen bg-black text-warm-white font-sans antialiased">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
