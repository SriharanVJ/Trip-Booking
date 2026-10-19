import { Link } from "@tanstack/react-router";
import { Car, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

/**
 * The one platform footer, used by every route. Deep ink canvas with the
 * brand gold — replaces the per-app footers (including Book Travels' blue one).
 */
export function SiteFooter() {
  const services = [
    { name: "Book Travels", href: "/travels", internal: true },
    { name: "Acting Driver", href: "/driver", internal: true },
    // /valet arrives with the Valet Parking service; plain anchor until then.
    { name: "Valet Parking", href: "/valet", internal: false },
  ];

  const quickLinks = [
    { name: "All Routes", href: "/travels/routes" },
    { name: "Our Fleet", href: "/travels/vehicles" },
    { name: "My Bookings", href: "/travels/bookings" },
  ];

  return (
    <footer className="border-t border-gold/10 bg-black-dark text-warm-white-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-gold to-gold-dark shadow-gold">
                <Car className="h-7 w-7 text-black" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-gradient-gold">
                  Sri<span className="text-gold">Travels</span>
                </span>
                <p className="text-xs uppercase tracking-[0.2em] text-gold/60">Premium Services</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-warm-white-dark/80">
              One luxury platform: premium vehicle rentals with Book Travels, personal drivers for
              your own car with Acting Driver, and elegant event coverage with Valet Parking.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-white/5 text-warm-white-dark transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-6 font-display text-base font-semibold uppercase tracking-wide text-warm-white">
              Our Services
            </h3>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.name}>
                  {item.internal ? (
                    <Link
                      to={item.href}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-gold"
                    >
                      <span className="h-1 w-1 rounded-full bg-gold/60"></span>
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-gold"
                    >
                      <span className="h-1 w-1 rounded-full bg-gold/60"></span>
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-6 font-display text-base font-semibold uppercase tracking-wide text-warm-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-2 text-sm transition-colors hover:text-gold"
                  >
                    <span className="h-1 w-1 rounded-full bg-gold/60"></span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 font-display text-base font-semibold uppercase tracking-wide text-warm-white">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-white/5">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-warm-white-dark/70">Phone</p>
                  <p className="text-warm-white">+91 98765 43210</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-white/5">
                  <Mail className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-warm-white-dark/70">Email</p>
                  <p className="text-warm-white">support@ajholidays.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-white/5">
                  <MapPin className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-warm-white-dark/70">Address</p>
                  <p className="text-warm-white">Tirupur, Tamil Nadu</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gold/10 pt-8 text-sm text-warm-white-dark/70 md:flex-row">
          <p>&copy; {new Date().getFullYear()} SriTravels. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="cursor-default">Terms of Service</span>
            <span className="cursor-default">Privacy Policy</span>
            <span className="cursor-default">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
