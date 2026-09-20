import { createFileRoute } from "@tanstack/react-router";
import { DriverApp } from "@/apps/driver";
import { AppSwitcher } from "@/components/app-switcher";

export const Route = createFileRoute("/driver/partner")({
  head: () => ({
    meta: [
      { title: "Driver Dashboard | Acting Driver" },
      { name: "description", content: "Manage availability, booking requests, trips, and earnings with Acting Driver." },
      { property: "og:title", content: "Driver Dashboard | Acting Driver" },
      { property: "og:description", content: "Manage availability, booking requests, trips, and earnings with Acting Driver." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <AppSwitcher />
      <DriverApp />
    </>
  ),
});
