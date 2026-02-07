import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Inter is an excellent system font that works beautifully with the opulent design
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gladystravel.ai'),
  title: {
    default: "Gladys Travel AI - Your Autonomous Travel Agent",
    template: "%s | Gladys Travel AI"
  },
  description: "AI-powered event travel planning with autonomous booking, price comparison, and complete trip packages worldwide. Sports, concerts, festivals - all in one place.",
  keywords: [
    "travel AI",
    "event travel", 
    "autonomous booking",
    "ticket comparison",
    "trip planner",
    "sports events",
    "concerts",
    "festivals",
    "AI travel agent",
    "event-first travel",
    "Gladys AI"
  ],
  authors: [{ name: "Gladys Travel AI", url: "https://gladystravel.ai" }],
  creator: "Gladys Travel AI",
  publisher: "Gladys Travel AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gladystravel.ai",
    siteName: "Gladys Travel AI",
    title: "Gladys Travel AI - Your Autonomous Travel Agent",
    description: "AI-powered event travel planning with autonomous booking and price comparison",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gladys Travel AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gladys Travel AI - Your Autonomous Travel Agent",
    description: "Your autonomous AI travel agent for event-focused trips",
    creator: "@GladysTravelAI",
    images: ["/twitter-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1F28" },
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  category: "travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Essential Meta Tags */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gladys Travel" />
        
        {/* PWA Support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Performance Hints */}
        <link rel="dns-prefetch" href="https://api.gladystravel.ai" />
        <link rel="preconnect" href="https://api.gladystravel.ai" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        className={`${inter.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-gray-900 dark:text-white transition-colors duration-200`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Providers>
            {/* Main Content */}
            <main className="min-h-screen">
              {children}
            </main>

            {/* Global Toast Notifications */}
            <Toaster 
              position="top-right"
              expand={true}
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                className: 'rounded-xl border-2 shadow-2xl',
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '2px solid var(--toast-border)',
                },
              }}
            />

            {/* Analytics & Performance Monitoring */}
            <Analytics />
            <SpeedInsights />

            {/* Accessibility: Skip to main content */}
            <a 
              href="#main-content" 
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-amber-500 focus:text-white focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-amber-300"
            >
              Skip to main content
            </a>
          </Providers>
        </AuthProvider>

        {/* Global Styles for Toasts */}
        <style jsx global>{`
          :root {
            --toast-bg: white;
            --toast-color: #1f2937;
            --toast-border: #f59e0b;
          }
          
          .dark {
            --toast-bg: #18181b;
            --toast-color: #f4f4f5;
            --toast-border: #f59e0b;
          }

          /* Smooth scrolling for all browsers */
          html {
            scroll-behavior: smooth;
          }

          /* Custom scrollbar styling */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 6px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }

          .dark ::-webkit-scrollbar-thumb {
            background: #52525b;
            border: 3px solid transparent;
            background-clip: padding-box;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
            border: 3px solid transparent;
            background-clip: padding-box;
          }

          .dark ::-webkit-scrollbar-thumb:hover {
            background: #71717a;
            border: 3px solid transparent;
            background-clip: padding-box;
          }

          /* Focus visible styles for accessibility */
          *:focus-visible {
            outline: 2px solid #f59e0b;
            outline-offset: 2px;
          }

          /* Reduced motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            :root {
              --toast-border: #000000;
            }
            .dark {
              --toast-border: #ffffff;
            }
          }

          /* Print styles */
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}