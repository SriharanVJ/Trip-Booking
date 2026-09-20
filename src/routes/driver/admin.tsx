import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/apps/admin";
import { AppSwitcher } from "@/components/app-switcher";

export const Route = createFileRoute("/driver/admin")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard | Acting Driver" },
      { name: "description", content: "Monitor bookings, drivers, pricing, and customer dues for Acting Driver." },
      { property: "og:title", content: "Operations Dashboard | Acting Driver" },
      { property: "og:description", content: "Monitor bookings, drivers, pricing, and customer dues for Acting Driver." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <AppSwitcher />
      <AdminApp />
    </>
  ),
});
