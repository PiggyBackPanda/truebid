import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorksToggle } from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "How It Works — TrueBid",
  description:
    "Learn how TrueBid's transparent property sales platform works for sellers and buyers. No agent commissions, no hidden fees. Free to list.",
};

// ── Content ───────────────────────────────────────────────────────────────────

const OPEN_OFFERS_QA = [
  {
    q: "How does it work?",
    a: 'When a seller lists with Open Offers, they set a closing date (typically 2–4 weeks away). During that time, any verified buyer can place an offer. Every offer appears on a live, public board showing the amount and when it was placed. Buyer identities, personal details, and offer conditions are kept private — buyers are identified only by anonymous aliases such as "Buyer_7a3k". Amounts and timing are fully transparent.',
  },
  {
    q: "What makes it different from a traditional auction?",
    a: "At a traditional auction, you have minutes to decide under extreme pressure, in a crowd, with an auctioneer pushing the pace. With Open Offers, you have days or weeks to think. You can arrange your finance, do your research, consult your family, and decide what the property is truly worth to you. No auctioneer, no crowd pressure, no hidden reserve games.",
  },
  {
    q: "What about sniping?",
    a: "Our anti-snipe protection means no one can swoop in at the last second. If a new offer is placed within 15 minutes of the closing time, the clock automatically extends by 15 minutes — just like a live auction where bidding continues as long as there is activity. The auction ends when the bidding stops, not when the clock stops.",
  },
  {
    q: "Does the seller have to accept the highest offer?",
    a: "No. The seller can accept any offer — including a lower one with better conditions. An unconditional offer with a 30-day settlement might be more valuable than a higher offer subject to finance with a 90-day settlement. This is exactly how real property transactions work — TrueBid just makes it visible.",
  },
  {
    q: "Is it free?",
    a: "Yes. Listing on TrueBid and using Open Offers is completely free. No commission, no listing fee, no hidden charges. We make money through optional premium services and referral partnerships with conveyancers and inspectors — services you'd use regardless of how you sell.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <div className="bg-navy py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-white mb-5"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Selling and buying property,
            <br className="hidden sm:block" /> without the middleman.
          </h1>
          <p
            className="text-white/65 max-w-2xl mx-auto"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            TrueBid gives you the tools to sell your home yourself — for free.
            No agent commissions. No hidden fees. Just transparent, fair property
            transactions between real people.
          </p>
        </div>
      </div>

      {/* Seller / Buyer toggle + steps */}
      <HowItWorksToggle />

      <div className="border-t border-border" />

      {/* Section 3: About Open Offers */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-navy text-center mb-3"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            What is Open Offers?
          </h2>
          <p className="text-text-muted text-center text-sm mb-10">
            Think of it as an auction — but fairer, less stressful, and open for
            weeks instead of minutes.
          </p>

          <div className="space-y-3">
            {OPEN_OFFERS_QA.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-border rounded-lg p-6"
              >
                <h3
                  className="font-semibold text-navy mb-2"
                  style={{ fontSize: 15, fontFamily: "Outfit, sans-serif" }}
                >
                  {item.q}
                </h3>
                <p
                  className="text-text-muted leading-relaxed"
                  style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-navy text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to sell without the middleman?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-amber-light transition-colors shadow-amber"
            >
              List your home — free →
            </Link>
            <Link
              href="/listings"
              className="inline-block text-white font-medium text-sm px-8 py-4 rounded-[10px] hover:bg-white/10 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              Browse properties →
            </Link>
          </div>
          <p
            className="text-center mt-10"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Identity verified buyers and sellers · Real-time transparent offers ·
            No commissions, ever · Australian owned and operated
          </p>
        </div>
      </section>
    </div>
  );
}
