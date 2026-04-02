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
        {/* Background photo: desktop only for performance */}
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
            Sell your property.
            <br />
            Transparently.
            <br />
            On your terms.
          </h1>

          <p
            style={{
              fontFamily:
                "var(--font-sans)",
              fontSize: 18,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.72)",
            }}
            className="max-w-xl mx-auto mb-10"
          >
            Sellers list free during our launch period. Buyers place offers openly.{" "}
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
                  "var(--font-sans)",
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
                    "var(--font-sans)",
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

      {/* ── How it works: 3 steps ──────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e2db" }}>
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#f59e0b",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(22px, 3.5vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "#0f1623",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Sell without an agent in four steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "1", title: "Create your listing", body: "Enter your property details, upload photos, and choose your sale method. Takes about 15 minutes." },
              { n: "2", title: "Go live instantly", body: "Publish and your listing appears to buyers immediately. No review delays, no gatekeepers." },
              { n: "3", title: "Buyers place live offers", body: "Every offer is visible on your live board in real time. Genuine competition, in the open." },
              { n: "4", title: "Proceed and settle", body: "Choose the offer that suits you best, then hand over to your conveyancer for settlement." },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#0f1623",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {n}
                </div>
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 16,
                    fontWeight: 400,
                    color: "#0f1623",
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/how-it-works"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                color: "#334766",
                textDecoration: "underline",
              }}
            >
              Full walkthrough for sellers and buyers
            </Link>
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

      {/* ── Why TrueBid: 3 features ─────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", borderTop: "1px solid #e5e2db", borderBottom: "1px solid #e5e2db" }}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(22px, 3.5vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "#0f1623",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            A fairer way to sell
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#f59e0b" strokeWidth="2" />
                  </svg>
                ),
                title: "Live Offers",
                body: "Every offer is visible to every buyer in real time. No secret negotiations. No phantom offers. Genuine competition, in the open.",
                link: "/how-it-works",
                linkLabel: "How Live Offers works",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <line x1="12" y1="1" x2="12" y2="23" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "No commission",
                body: "Listing is free during our launch period. Placing offers is always free. There is no commission on any transaction. The saving on a $900,000 home can exceed $20,000.",
                link: "/guides/true-cost-of-selling-with-vs-without-an-agent",
                linkLabel: "See the cost comparison",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: "You stay in control",
                body: "Set your timeline, choose your sale method, and decide which offer to proceed with, or none at all. No obligation to sell at any price.",
                link: "/how-it-works",
                linkLabel: "Seller walkthrough",
              },
            ].map(({ icon, title, body, link, linkLabel }) => (
              <div key={title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#fef3dc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {icon}
                </div>
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 18,
                    fontWeight: 400,
                    color: "#0f1623",
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  {body}
                </p>
                <Link
                  href={link}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#334766",
                    textDecoration: "underline",
                    marginTop: "auto",
                  }}
                >
                  {linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <div style={{ background: "#f7f5f0", borderBottom: "1px solid #e5e2db" }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Identity verified participants", sub: "Every buyer and seller is verified before transacting" },
              { label: "Real-time live offers", sub: "Offer boards update live via WebSocket, no polling" },
              { label: "Anti-snipe protection", sub: "10-minute auto-extension on late offers keeps it fair" },
              { label: "Australian owned", sub: "Built in Perth by Australians, for Australians" },
            ].map(({ label, sub }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 15, fontWeight: 400, color: "#0f1623", lineHeight: 1.3 }}>
                  {label}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <div style={{ background: "#0f1623" }}>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 16,
            }}
          >
            Ready to sell on your terms?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            List your home free during our launch period. No commissions, no middleman.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              style={{
                background: "#f59e0b",
                color: "#1a0f00",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 32px",
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
              }}
            >
              List Your Home Free During Launch
            </Link>
            <Link
              href="/listings"
              style={{
                background: "rgba(255,255,255,0.10)",
                color: "#ffffff",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: 15,
                padding: "14px 28px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)",
                textDecoration: "none",
              }}
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
