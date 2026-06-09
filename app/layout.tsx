import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/shell/BottomNav";

// ui-ux-pro-max "Sports/Fitness" type system: Barlow body, Barlow Condensed
// headings, Bebas Neue for poster-scale impact.
const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const poster = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-poster" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Hyperthrophy",
  description: "Personal hypertrophy training tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hyperthrophy" },
};

export const viewport: Viewport = {
  themeColor: "#0C0A09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${poster.variable} ${mono.variable}`}>
      <body className="ambient min-h-screen font-sans antialiased">
        <Providers>
          <div className="mx-auto max-w-xl px-4 pb-28 pt-6">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
