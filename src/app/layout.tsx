import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueBid — Transparent Property Sales",
  description:
    "Free, transparent property sales for Australia. No agent commissions. Real offers, publicly visible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        {children}
      </body>
    </html>
  );
}
