import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | TrueBid",
  description:
    "TrueBid is free to list during our launch period. No agent commissions, no listing fees, no hidden charges. See what's included.",
};

const INCLUDED = [
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: "Full property listing",
    desc: "Photos, description, floor plan, open home times, all sale method options.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Live Offers board",
    desc: "Real-time, transparent offer process with anti-snipe protection and a live public board.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Buyer notifications",
    desc: "Buyers are notified when new offers are placed, when they are outranked, and when the offer period closes.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Direct messaging",
    desc: "Buyers and sellers communicate directly through the platform. No agent relay.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Seller dashboard",
    desc: "Track offers, manage inspection bookings, view buyer enquiries, and control your listing.",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Identity verification",
    desc: "All buyers and sellers are identity-verified before transacting. Fewer time-wasters.",
  },
];

const COMPARISON = [
  { feature: "Listing fee", truebid: "Free during launch", agent: "$0 upfront" },
  { feature: "Commission on sale", truebid: "None", agent: "Typically 2.0%–3.5% of sale price" },
  { feature: "Marketing fees", truebid: "No additional charge", agent: "Typically $2,000–$12,000+ depending on campaign and price point" },
  { feature: "Offer transparency", truebid: "Optional: Live Offers board, Private Offers, or Fixed Price", agent: "Agent advises seller of offers received. Not visible to buyers." },
  { feature: "Seller controls price", truebid: "Yes, always", agent: "Agent negotiates on seller's behalf" },
  { feature: "Direct buyer contact", truebid: "Yes, via platform messaging", agent: "Via agent" },
];

export default function PricingPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <div className="bg-navy py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-white mb-5"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Simple, honest pricing.
          </h1>
          <p
            className="text-white/65 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.6 }}
          >
            No commissions. No agent fees. No hidden charges.
            During our launch period, listing your property on TrueBid is completely free.
          </p>
        </div>
      </div>

      {/* Pricing card */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e5e2db", boxShadow: "0 4px 24px rgba(15,22,35,0.08)" }}
          >
            {/* Card header */}
            <div className="bg-navy px-8 py-6 text-center">
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 16,
                }}
              >
                Seller listing fee
              </p>

              {/* Price display */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "clamp(52px, 10vw, 72px)",
                      fontWeight: 400,
                      color: "#f59e0b",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    $0
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 16,
                      fontFamily: "var(--font-sans)",
                      marginBottom: 4,
                    }}
                  >
                    per listing
                  </span>
                </div>
                <p
                  style={{
                    color: "#f59e0b",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    marginTop: 10,
                    letterSpacing: "0.02em",
                  }}
                >
                  During launch period
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    marginTop: 8,
                  }}
                >
                  A per-listing fee will be introduced in the future with advance notice.
                </p>
              </div>
            </div>

            {/* Free period disclaimer */}
            <div
              style={{
                background: "#fffbeb",
                borderBottom: "1px solid #fde68a",
                padding: "14px 24px",
              }}
            >
              <p
                style={{
                  color: "#92400e",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Listing is free during TrueBid&apos;s launch period. Fees will be introduced in the future
                with advance notice. Any listings active at the time of the fee change will complete
                their current listing period at no charge.
              </p>
            </div>

            {/* What's included */}
            <div className="px-8 py-8">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 20,
                }}
              >
                Everything included
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INCLUDED.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-amber mt-0.5 flex-shrink-0">{item.icon}</span>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#0f1623",
                          fontFamily: "var(--font-sans)",
                          marginBottom: 2,
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-8 pb-8">
              <Link
                href="/register"
                className="block w-full text-center font-semibold py-4 rounded-[10px] transition-colors"
                style={{
                  background: "#f59e0b",
                  color: "#1a0f00",
                  fontSize: 15,
                  fontFamily: "var(--font-sans)",
                  textDecoration: "none",
                }}
              >
                List Your Home Free During Launch
              </Link>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#9ca3af",
                  fontFamily: "var(--font-sans)",
                  marginTop: 10,
                }}
              >
                No credit card required. No agent. No commission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-navy text-center mb-3"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            TrueBid vs. Traditional Sales Agent
          </h2>
          <p className="text-text-muted text-center text-sm mb-8">
            How TrueBid&apos;s costs compare to typical agent fees. Actual outcomes depend on the price you achieve and the specific services you use.
          </p>

          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e5e2db" }}
          >
            {/* Table header */}
            <div className="grid grid-cols-3 bg-navy">
              <div className="px-5 py-3" />
              <div className="px-5 py-3 text-center">
                <p style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                  TrueBid
                </p>
              </div>
              <div className="px-5 py-3 text-center">
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                  Traditional Sales Agent
                </p>
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 border-b border-border last:border-0"
                style={{ background: i % 2 === 0 ? "#ffffff" : "#f9f8f6" }}
              >
                <div className="px-5 py-4">
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f1623", fontFamily: "var(--font-sans)" }}>
                    {row.feature}
                  </p>
                </div>
                <div className="px-5 py-4 text-center">
                  <p style={{ fontSize: 13, color: "#059669", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                    {row.truebid}
                  </p>
                </div>
                <div className="px-5 py-4 text-center">
                  <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-sans)" }}>
                    {row.agent}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
              fontFamily: "var(--font-sans)",
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            Commission range sourced from REIA reported state averages (2.0%–3.5%). Marketing fee estimates
            reflect typical flat-fee campaign costs and vary by price point. Figures are a guide only.
            Whether you use an agent or sell yourself, additional costs apply regardless, including a settlement
            agent or conveyancer, professional photography, and any legal conveyancing work. This comparison
            shows platform and agent-related costs only. It does not account for any difference in sale price
            that may or may not result from selling with or without an agent. Always obtain independent advice
            before making decisions.
          </p>
        </div>
      </section>

      {/* FAQ mini */}
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-navy text-center mb-8"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 24,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Pricing questions
          </h2>
          <div className="space-y-4">
            <PricingFaq
              q="When will fees be introduced?"
              a="We will give registered users at least 30 days written notice before any fees come into effect. There is no set date. We are focused on building the best product for Australian sellers and buyers first."
            />
            <PricingFaq
              q="What happens to my active listing when fees are introduced?"
              a="Any listing that is active at the time fees are introduced will complete its current listing period at no charge. You will never be charged retroactively for time already elapsed."
            />
            <PricingFaq
              q="Are there any platform fees right now?"
              a="No. Listing on TrueBid during the launch period is entirely free. No commission, no listing fee, no photography package upsells."
            />
            <PricingFaq
              q="What will the future listing fee cover?"
              a="The per-listing fee will cover a full listing period on the TrueBid platform, including the Live Offers board, direct messaging, the seller dashboard, buyer notifications, and identity verification for all parties. It will not cover costs you would incur regardless of how you sell."
            />
            <PricingFaq
              q="What costs will I still have when selling through TrueBid?"
              a="Selling any property involves costs that exist regardless of whether you use an agent or TrueBid. These typically include: a settlement agent or conveyancer (legally required in WA, typically $1,500 to $2,500), professional photography (strongly recommended, typically $300 to $700), and a building and pest inspection if the buyer requires one. You may also choose to invest in home staging or other presentation costs. TrueBid does not charge commission or a listing fee during the launch period, but these other costs remain your responsibility."
            />
            <PricingFaq
              q="Do agents cover costs that I would otherwise pay myself?"
              a="Not necessarily. Agent commission covers the agent's services: marketing your property, conducting inspections, and negotiating on your behalf. However, many of the costs involved in selling a property are separate from the agent's fee. You will still need a settlement agent or conveyancer regardless of whether you use an agent. Some agents include basic marketing in their commission, but premium marketing campaigns (portal listings, professional photography, signage) are often charged separately on top. Always ask for a full itemised breakdown before signing any agency agreement."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-navy text-center">
        <div className="max-w-xl mx-auto">
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to list?
          </h2>
          <p
            className="text-white/55 text-sm mb-8"
            style={{ fontFamily: "var(--font-sans)", lineHeight: 1.6 }}
          >
            Create your account and list your property free during our launch period.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block font-semibold text-sm px-8 py-4 rounded-[10px] transition-colors"
              style={{
                background: "#f59e0b",
                color: "#1a0f00",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              Get Started
            </Link>
            <Link
              href="/how-it-works"
              className="inline-block text-white font-medium text-sm px-8 py-4 rounded-[10px] hover:bg-white/10 transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingFaq({ q, a }: { q: string; a: string }) {
  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{ border: "1px solid #e5e2db" }}
    >
      <h3
        className="font-semibold text-navy mb-2"
        style={{ fontSize: 15, fontFamily: "var(--font-sans)" }}
      >
        {q}
      </h3>
      <p
        className="text-text-muted leading-relaxed"
        style={{ fontSize: 14, fontFamily: "var(--font-sans)" }}
      >
        {a}
      </p>
    </div>
  );
}
