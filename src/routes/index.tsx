import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bus, CarTaxiFront } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const services = [
  {
    to: "/travels",
    name: "Book Travels",
    tagline: "Rent premium vehicles for your next trip",
    description:
      "Browse coaches, vans, and cars with transparent pricing, live availability, and instant booking.",
    icon: Bus,
  },
  {
    to: "/driver",
    name: "Book Acting Driver",
    tagline: "A trusted driver for your own car",
    description:
      "Book a driver by location (A→B) or by the hour, track your trip in real time, and manage everything online.",
    icon: CarTaxiFront,
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              One platform, two services
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-warm-white sm:text-5xl">
              What would you like to book today?
            </h1>
            <p className="mt-4 text-muted-foreground">
              Choose a service to continue. You can switch between them anytime from the header.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <Link
                key={service.to}
                to={service.to}
                className="glass-luxury-card group flex flex-col rounded-2xl border border-gold/20 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gold/30 bg-linear-to-br from-gold to-gold-dark shadow-gold">
                  <service.icon className="h-7 w-7 text-black" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-warm-white">
                  {service.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-gold">{service.tagline}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-warm-white-dark/70">
                  {service.description}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold">
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Book Travels & Acting Driver" },
      {
        name: "description",
        content: "One platform: rent premium vehicles with Book Travels, or book a personal driver for your own car.",
      },
      { property: "og:title", content: "Book Travels & Acting Driver" },
      {
        property: "og:description",
        content: "One platform: rent premium vehicles with Book Travels, or book a personal driver for your own car.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
