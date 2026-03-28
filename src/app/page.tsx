"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SavingsCalculator } from "@/components/SavingsCalculator";
import { Logo } from "@/components/Logo";

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
            style={{ background: "rgba(15, 22, 35, 0.60)" }}
          />
        </div>

        {/* Hero content */}
        <div
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
          style={{ paddingTop: 80, paddingBottom: 96 }}
        >
          {/* Wordmark */}
          <div className="mb-12">
            <Logo variant="light" className="text-2xl" />
          </div>

          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
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
            Transparent.
            <br />
            On your terms.
          </h1>

          <p
            style={{
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 18,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.72)",
            }}
            className="max-w-xl mx-auto mb-10"
          >
            Sellers list Free during our launch period. Buyers bid openly.{" "}
            <span className="whitespace-nowrap">No agent commissions.</span> No
            middleman. Just honest property sales.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/listings"
              style={{
                background: "#f59e0b",
                color: "#1a0f00",
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 32px",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                textDecoration: "none",
              }}
            >
              Browse Listings
            </Link>
            {status !== "loading" && (
              <Link
                href={
                  status === "authenticated" ? "/listings/create" : "/register"
                }
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#0f1623",
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
