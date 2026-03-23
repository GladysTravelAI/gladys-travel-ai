import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VapiProvider } from "@/components/VapiProvider";
import MobileTabBar from "@/components/MobileTabBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// ── Next.js 15: viewport & themeColor must be a separate export ──────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0EA5E9' },
    { media: '(prefers-color-scheme: dark)',  color: '#0F172A' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://gladystravel.com'),
  title: {
    default: "Gladys Travel — Plan Trips Around Events You Love",
    template: "%s | Gladys Travel",
  },
  description: "Gladys is your AI travel companion for event-based trips. Search a concert, match, or festival and get a complete 5-day itinerary — flights, hotels, tickets, and local tips — in seconds.",
  keywords: [
    "AI travel planner", "event travel", "sports trip planner", "concert travel",
    "festival travel", "Champions League travel", "World Cup 2026 travel",
    "trip planner AI", "Gladys Travel", "event-first travel", "travel AI agent",
    "football travel packages", "NBA Finals travel", "Coachella travel",
  ],
  authors:   [{ name: "Gladys Travel", url: "https://gladystravel.com" }],
  creator:   "Gladys Travel",
  publisher: "Gladys Travel",
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1,
    },
  },
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         "https://gladystravel.com",
    siteName:    "Gladys Travel",
    title:       "Gladys Travel — Plan Trips Around Events You Love",
    description: "Search any event — match, concert, festival — and Gladys builds your complete trip in seconds. Flights, hotels, tickets, and local tips all in one place.",
    images: [{
      url:    "/api/og",
      width:  1200,
      height: 630,
      alt:    "Gladys Travel — AI-powered event travel planning",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Gladys Travel — Plan Trips Around Events You Love",
    description: "Search any concert, match or festival and get a complete trip plan in seconds.",
    creator:     "@GladysTravel",
    images:      ["/api/og"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg",        type: "image/svg+xml"  },
      { url: "/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/favicon.ico",        sizes: "any"           },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png", rel: "icon" }],
  },
  category: "travel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* ── Google Analytics 4 ── */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Travelpayouts Verification */}
        <script
          data-noptimize="1" data-cfasync="false" data-wpfc-render="false"
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=document.createElement("script");s.async=1;s.src='https://emrldtp.com/NTAwNTQw.js?t=500540';document.head.appendChild(s);})();`
          }}
        />
        <meta name="agd-partner-manual-verification" />
        <meta name="fo-verify" content="48d40b28-b7e9-4c44-ba48-1bf20f044f5a" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gladys Travel" />

        {/* Android PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Performance */}
        <link rel="dns-prefetch"  href="https://api.gladystravel.com" />
        <link rel="preconnect"    href="https://api.gladystravel.com" />
        <link rel="preconnect"    href="https://fonts.googleapis.com" />
        <link rel="preconnect"    href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}
        suppressHydrationWarning
      >
        <ThemeProvider>
        <AuthProvider>
          <Providers>
            <VapiProvider>
              {/*
                pb-16 on mobile creates space so the bottom tab bar
                doesn't cover page content. md:pb-0 removes it on desktop.
              */}
              <main id="main-content" className="min-h-screen pb-16 md:pb-0">
                {children}
              </main>

              {/* Bottom tab bar — mobile only, rendered globally */}
              <MobileTabBar />

              <Toaster
                position="top-right"
                expand={true}
                richColors
                closeButton
                duration={4000}
                toastOptions={{ className: 'rounded-xl border-2 shadow-2xl' }}
              />

              <Analytics />
              <SpeedInsights />
            </VapiProvider>

            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-sky-500 focus:text-white focus:rounded-xl focus:shadow-2xl"
            >
              Skip to main content
            </a>
          </Providers>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}