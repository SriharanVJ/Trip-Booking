import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

// Optimize font loading with preload
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false, // Only load when needed
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: {
    default: 'AJ Holidays - Luxury Travel Experience',
    template: '%s | AJ Holidays',
  },
  description: 'Experience Tamil Nadu like never before with our premium fleet of vehicles. Luxury bus booking made elegant.',
  keywords: ['luxury travel', 'bus booking', 'premium vehicles', 'Tamil Nadu tourism', 'AJ Holidays'],
  authors: [{ name: 'AJ Holidays' }],
  creator: 'AJ Holidays',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AJ Holidays - Luxury Travel Experience',
    description: 'Experience Tamil Nadu like never before with our premium fleet of vehicles.',
    siteName: 'AJ Holidays',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AJ Holidays - Luxury Travel Experience',
    description: 'Experience Tamil Nadu like never before with our premium fleet of vehicles.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Disable emoji rendering for better performance */}
        <style dangerouslySetInnerHTML={{
          __html: `
            img[src*="unsplash.com"] {
              content-visibility: auto;
            }
          `
        }} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <div className="flex flex-col min-h-screen bg-black text-warm-white">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
