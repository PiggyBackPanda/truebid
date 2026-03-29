import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { BASE_URL } from "@/lib/constants";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrueBid | Transparent Property Sales",
    template: "%s | TrueBid",
  },
  description:
    "Free, transparent property sales for Australia. No agent commissions. Real offers, publicly visible.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: "TrueBid",
    type: "website",
    locale: "en_AU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${outfit.variable} ${dmSerifDisplay.variable}`} style={{ "--font-serif": "var(--font-dm-serif), Georgia, 'Times New Roman', serif", "--font-heading": "var(--font-dm-serif), Georgia, 'Times New Roman', serif" } as React.CSSProperties}>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
