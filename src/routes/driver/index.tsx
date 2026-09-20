import { createFileRoute } from "@tanstack/react-router";
import { CustomerApp } from "@/apps/customer";
import { AppSwitcher } from "@/components/app-switcher";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "Book a Personal Driver | Acting Driver" },
      { name: "description", content: "Book a trusted driver for your own car by location or by the hour." },
      { property: "og:title", content: "Book a Personal Driver | Acting Driver" },
      { property: "og:description", content: "Book a trusted driver for your own car by location or by the hour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <AppSwitcher />
      <CustomerApp />
    </>
  ),
});
