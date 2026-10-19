import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Car, Menu, X, LogIn, Crown, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The one platform header, used by every route: landing page, Book Travels,
 * Book Acting Driver, and Valet Parking. Gold luxury chrome, service links,
 * always-visible way back to the landing page, and the account actions.
 */
export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    { name: "Book Travels", href: "/travels", internal: true },
    { name: "Acting Driver", href: "/driver", internal: true },
    // /valet arrives with the Valet Parking service; plain anchor until then.
    { name: "Valet Parking", href: "/valet", internal: false },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled ? "glass-luxury border-b border-gold/20 shadow-luxury" : "border-b border-transparent bg-black/40 backdrop-blur-md",
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo — always a way back to the landing page */}
          <Link to="/" className="group flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-linear-to-br from-gold to-gold-light opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-60"></div>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-linear-to-br from-gold to-gold-dark shadow-gold-lg transition-all duration-500 group-hover:scale-105">
                <Car className="h-6 w-6 text-black" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-gradient-gold">
                Sri<span className="text-gold">Travels</span>
              </span>
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold/70">
                Premium Services
              </div>
            </div>
          </Link>

          {/* Desktop service navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            {services.map((item) =>
              item.internal ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group relative rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    pathname.startsWith(item.href)
                      ? "bg-gold/10 text-gold"
                      : "text-warm-white-dark/80 hover:bg-gold/5 hover:text-gold",
                  )}
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="group relative rounded-xl px-4 py-2.5 text-sm font-medium text-warm-white-dark/80 transition-all duration-300 hover:bg-gold/5 hover:text-gold"
                >
                  {item.name}
                </a>
              ),
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-warm-white-dark/70 transition-colors hover:text-gold">
              <LayoutGrid className="h-4 w-4" />
              Home
            </Link>
            <Link to="/travels/login">
              <Button variant="gold-outline" size="sm" className="px-5">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link to="/travels/register">
              <Button variant="gradient" size="sm" className="px-5">
                <Crown className="h-4 w-4" />
                Join Now
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="inline-flex items-center justify-center rounded-xl p-3 text-warm-white-dark/70 transition-all duration-200 hover:bg-gold/5 hover:text-gold"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="glass-luxury animate-fade-in-luxury border-t border-gold/10 py-6 lg:hidden">
            <div className="space-y-2">
              {services.map((item) =>
                item.internal ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "block rounded-xl px-5 py-4 font-medium transition-all duration-200",
                      pathname.startsWith(item.href)
                        ? "bg-gold/10 text-gold"
                        : "text-warm-white-dark/80 hover:bg-gold/5 hover:text-gold",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block rounded-xl px-5 py-4 font-medium text-warm-white-dark/80 transition-all duration-200 hover:bg-gold/5 hover:text-gold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ),
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-gold/10 px-5 pt-6">
              <Link to="/" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="h-12 w-full justify-start rounded-xl">
                  <LayoutGrid className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/travels/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="gold-outline" className="h-12 w-full rounded-xl">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link to="/travels/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="gradient" className="h-12 w-full rounded-xl">
                  <Crown className="h-4 w-4" />
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Gold progress shimmer */}
      <div className="h-[2px] overflow-hidden bg-linear-to-r from-transparent via-gold/50 to-transparent">
        <div className="h-full w-1/3 animate-shimmer-gold bg-linear-to-r from-gold/20 via-gold/40 to-gold/20"></div>
      </div>
    </header>
  );
}
