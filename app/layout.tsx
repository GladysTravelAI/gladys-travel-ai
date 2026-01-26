import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { AuthProvider } from "@/lib/AuthContext";

// Inter is an excellent system font that works beautifully with the opulent design
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "Gladys Travel AI - Your Autonomous Travel Agent",
  description: "AI-powered event travel planning with autonomous booking, price comparison, and complete trip packages worldwide. Sports, concerts, festivals - all in one place.",
  keywords: "travel AI, event travel, autonomous booking, ticket comparison, trip planner, sports events, concerts, festivals",
  authors: [{ name: "Gladys Travel AI" }],
  openGraph: {
    title: "Gladys Travel AI - Your Autonomous Travel Agent",
    description: "AI-powered event travel planning with autonomous booking and price comparison",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gladys Travel AI",
    description: "Your autonomous AI travel agent for event-focused trips",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1F28" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body 
        className={`${inter.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-gray-900 dark:text-white transition-colors duration-200`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Providers>
            {/* No Navbar here - it's in HomeClient.tsx */}
            <main className="min-h-screen">
              {children}
            </main>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}