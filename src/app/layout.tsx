import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrueBid | Transparent Property Sales",
    template: "%s | TrueBid",
  },
  description:
    "Free, transparent property sales for Australia. No agent commissions. Real offers, publicly visible.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au"
  ),
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
    <html lang="en" className={`h-full antialiased ${outfit.variable}`}>
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
