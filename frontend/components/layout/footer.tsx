import Link from 'next/link'
import { Car, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Car className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">AJ Holidays</span>
                <p className="text-sm text-gray-400">Premium Vehicle Rentals</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted partner for comfortable and affordable vehicle rentals across Tamil Nadu.
              From cars to buses, we have the perfect ride for every journey.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-base uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/routes" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  All Routes
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Vehicle Types */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-base uppercase tracking-wide">Vehicles</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/vehicles?type=car" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="text-lg">🚗</span>
                  Cars
                </Link>
              </li>
              <li>
                <Link href="/vehicles?type=traveller" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="text-lg">🚌</span>
                  Travellers
                </Link>
              </li>
              <li>
                <Link href="/vehicles?type=coach" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="text-lg">🚐</span>
                  Coaches
                </Link>
              </li>
              <li>
                <Link href="/vehicles?type=bus" className="hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                  <span className="text-lg">🚌</span>
                  Buses
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-base uppercase tracking-wide">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-white">+91 98765 43210</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-white">support@ajholidays.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Address</p>
                  <p className="text-white">Tirupur, Tamil Nadu</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} AJ Holidays. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund" className="hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
