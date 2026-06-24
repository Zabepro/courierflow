import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider, PostHogIdentify } from "@/lib/posthog/provider";
import { PostHogPageView } from "@/lib/posthog/pageview";
import { LanguageProvider } from "@/lib/i18n/context";
import { Suspense } from "react";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://courierflow.co.tz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CourierFlow — Delivery management for Tanzania",
    template: "%s · CourierFlow",
  },
  description:
    "Dispatch drivers, track parcels live, collect mobile-money payments and capture proof of delivery — the all-in-one delivery platform built for couriers across Tanzania.",
  keywords: ["delivery management", "courier software", "Tanzania", "M-Pesa", "parcel tracking", "fleet tracking", "logistics"],
  openGraph: {
    type: "website",
    siteName: "CourierFlow",
    title: "CourierFlow — Delivery management for Tanzania",
    description:
      "Dispatch drivers, track parcels live and collect mobile-money payments. Built for couriers across Tanzania.",
    images: [{ url: "/hero-delivery.jpg", width: 2400, height: 1600, alt: "CourierFlow — delivery rider on the move" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourierFlow — Delivery management for Tanzania",
    description: "Dispatch drivers, track parcels live and collect mobile-money payments.",
    images: ["/hero-delivery.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" translate="no" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
        <body className="font-body antialiased">
          <PostHogProvider>
            <PostHogIdentify />
            <Suspense><PostHogPageView /></Suspense>
            <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
              <LanguageProvider>
                {children}
                <Toaster richColors position="top-right" />
              </LanguageProvider>
            </ThemeProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
