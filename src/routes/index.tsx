import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bus, CarTaxiFront } from "lucide-react";

const apps = [
  {
    to: "/travels",
    name: "Book Travels",
    tagline: "Rent premium vehicles for your next trip",
    description:
      "Browse coaches, vans, and cars with transparent pricing, live availability, and instant booking.",
    icon: Bus,
    // Book Travels' own palette: black & gold luxury
    card: "border-amber-200/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#141005] hover:border-amber-300/40",
    iconWrap: "bg-gradient-to-br from-amber-300 to-yellow-600 text-black shadow-lg shadow-amber-500/20",
    accent: "text-amber-300",
  },
  {
    to: "/driver",
    name: "Book Acting Driver",
    tagline: "A trusted driver for your own car",
    description:
      "Book a driver by location (A→B) or by the hour, track your trip in real time, and manage everything online.",
    icon: CarTaxiFront,
    // Acting Driver's own palette: light, modern indigo
    card: "border-slate-200 bg-white text-slate-900 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100",
    iconWrap: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25",
    accent: "text-indigo-600",
  },
];

function Landing() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <span className="text-lg font-semibold tracking-tight">
          Sri<span className="text-amber-300">Travels</span> &amp; Drive
        </span>
        <span className="text-sm text-neutral-400">One platform, two services</span>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          What would you like to book today?
        </h1>
        <p className="mt-4 max-w-xl text-neutral-400">
          Choose a service to continue. You can switch between them anytime from the header.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.to}
              to={app.to}
              className={`group flex flex-col rounded-2xl border p-8 transition-all hover:-translate-y-1 ${app.card}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${app.iconWrap}`}>
                <app.icon className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">{app.name}</h2>
              <p className={`mt-1 text-sm font-medium ${app.accent}`}>{app.tagline}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-500 group-hover:text-neutral-400">
                {app.description}
              </p>
              <span className={`mt-8 inline-flex items-center gap-2 text-sm font-semibold ${app.accent}`}>
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-xs text-neutral-600">
        Book Travels &amp; Acting Driver — unified platform
      </footer>
    </main>
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
