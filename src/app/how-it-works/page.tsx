import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — TrueBid",
  description:
    "Learn how TrueBid's transparent property sales platform works for sellers and buyers. No agent commissions, no hidden fees. Free to list.",
};

// ── Content ───────────────────────────────────────────────────────────────────

const SELLER_STEPS = [
  {
    title: "Create your listing (15 minutes)",
    body: "Sign up and verify your identity, then enter your property details — address, bedrooms, bathrooms, land size, and a description of your home. Upload your best photos (your phone camera is fine — good lighting makes a big difference). Choose your sale method: Open Offers for transparent bidding, Private Offers if you prefer discretion, or Fixed Price if you know exactly what you want.",
  },
  {
    title: "Go live and attract buyers",
    body: "Hit publish and your listing is live on TrueBid immediately. Buyers can find your property through our search, browse the details, and — for Open Offers — see the live offer board. You manage everything from your seller dashboard: track views, respond to questions, and watch offers come in.",
  },
  {
    title: "Review offers and accept",
    body: "When your Open Offers closing date arrives, review all offers in your dashboard. You'll see each buyer's offer amount, their conditions, and their preferred settlement timeline. You choose the offer that suits you best — it doesn't have to be the highest. An unconditional offer with a quick settlement might be worth more to you than a higher offer subject to finance.",
  },
  {
    title: "Settle with your conveyancer",
    body: "Once you accept an offer, your settlement agent prepares the Contract of Sale. The buyer arranges their deposit, inspections, and finance. Both parties sign, and your settlement agent handles the transfer of title. We provide a checklist to guide you through every step.",
  },
];

const BUYER_STEPS = [
  {
    title: "Browse and search",
    body: "Find properties by suburb, postcode, or address. Filter by price, bedrooms, property type, and sale method. No sign-up needed to browse — see every listing, every photo, and every offer on the board.",
  },
  {
    title: "Verify and place an offer",
    body: "When you find a property you love, verify your identity (takes 2 minutes with your driver's licence) and place your offer. For Open Offers listings, you'll see exactly where your offer ranks against other buyers — no guesswork, no phantom offers, no games.",
  },
  {
    title: "Compete transparently",
    body: "You can see every other offer: the amount, the conditions, and the timing. If you're outbid, you'll be notified instantly so you can decide whether to raise your offer. You compete on both price and terms — an unconditional offer might win over a higher offer with conditions attached.",
  },
  {
    title: "Win and settle",
    body: "If the seller accepts your offer, you'll be notified immediately. From there, engage your own settlement agent, arrange your building and pest inspection (if conditional), finalise your finance, and proceed to exchange and settlement. We guide you through every step.",
  },
];

const OPEN_OFFERS_QA = [
  {
    q: "How does it work?",
    a: 'When a seller lists with Open Offers, they set a closing date (typically 2–4 weeks away). During that time, any verified buyer can place an offer. Every offer appears on a live, public board showing the amount, the conditions, and when it was placed. Buyers are identified by anonymous aliases — "Buyer_7a3k" — so your identity is protected, but the offer is transparent.',
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

// ── Components ────────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full bg-navy text-white font-bold text-sm"
        style={{ width: 32, height: 32, marginTop: 2 }}
      >
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-navy text-base mb-1.5">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

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

      {/* Section 1: For Sellers */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-navy text-center mb-10"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            How to sell your home on TrueBid
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SELLER_STEPS.map((step, i) => (
              <StepCard key={i} number={i + 1} title={step.title} body={step.body} />
            ))}
          </div>

          {/* Savings callout */}
          <div
            className="mt-12 rounded-lg p-6"
            style={{
              background: "rgba(232,168,56,0.08)",
              border: "1px solid rgba(232,168,56,0.3)",
            }}
          >
            <p
              className="font-semibold mb-1"
              style={{
                color: "#92650a",
                fontSize: 13,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              How much will you save?
            </p>
            <p
              style={{
                color: "#1a1a1a",
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              On the average Australian home ($800,000), you&apos;d save{" "}
              <strong>$15,000–$25,000</strong> in agent commissions and marketing
              fees. That money stays in your pocket.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-amber-light transition-colors shadow-amber"
            >
              List your home — free →
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Section 2: For Buyers */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-navy text-center mb-10"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            How to buy on TrueBid
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BUYER_STEPS.map((step, i) => (
              <StepCard key={i} number={i + 1} title={step.title} body={step.body} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/listings"
              className="inline-block bg-navy text-white font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-navy-light transition-colors"
            >
              Browse properties →
            </Link>
          </div>
        </div>
      </section>

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
