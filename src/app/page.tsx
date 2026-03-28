"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SavingsCalculator } from "@/components/SavingsCalculator";

const HERO_IMAGE_URL =
  "https://plus.unsplash.com/premium_photo-1661963657305-f52dcaeef418?w=1600&q=80";

export default function HomePage() {
  const { status } = useSession();
  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative bg-navy overflow-hidden">
        {/* Background photo — desktop only for performance */}
        <div className="hidden md:block absolute inset-0">
          <Image
            src={HERO_IMAGE_URL}
            alt="Australian residential property exterior"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Navy overlay at 60% opacity to keep text legible */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(15, 26, 46, 0.60)" }}
          />
        </div>

        {/* Hero content */}
        <div
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
          style={{ paddingTop: 80, paddingBottom: 96 }}
        >
          {/* Wordmark */}
          <div className="inline-flex items-center gap-3 mb-12">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#e8a838",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "DM Serif Display, Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#0f1a2e",
              }}
            >
              T
            </div>
            <span
              style={{
                fontFamily: "DM Serif Display, Georgia, serif",
                fontSize: 20,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              TrueBid
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              fontWeight: 700,
              color: "#ffffff",
            }}
            className="mb-6"
          >
            Property sales.
            <br />
            Transparent. Free.
          </h1>

          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 18,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.72)",
            }}
            className="max-w-xl mx-auto mb-10"
          >
            Sellers list for free. Buyers bid openly. No agent commissions.
            No middleman. Just honest property sales.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/listings"
              style={{
                background: "#e8a838",
                color: "#0f1a2e",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 32px",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(232, 168, 56, 0.35)",
                textDecoration: "none",
              }}
            >
              Browse Listings
            </Link>
            {status !== "loading" && (
              <Link
                href={status === "authenticated" ? "/listings/create" : "/register"}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  padding: "14px 28px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.30)",
                  textDecoration: "none",
                }}
              >
                List Your Property
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Savings Calculator ───────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#0f1a2e",
          }}
          className="mb-8"
        >
          How much will you save?
        </h2>
        <SavingsCalculator />
      </div>
    </main>
  );
}
