import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorksToggle } from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "How It Works | TrueBid",
  description:
    "Learn how TrueBid's transparent property sales platform works for sellers and buyers. No agent commissions, no hidden fees. Free to list.",
};

// ── Options comparison data ────────────────────────────────────────────────────

const SYS = "var(--font-sans)";

type Pathway = {
  name: string;
  badge?: string;
  steps: string[];
  sellerControls: string;
  othersControl: string;
  timeCommitment: string;
  typicalCost: string;
};

const PATHWAYS: Pathway[] = [
  {
    name: "Private Sale via Agent",
    steps: [
      "Research and shortlist agents. Interview at least two and ask each to demonstrate their recent sales in your area and their buyer database.",
      "Sign an agency agreement. This is a legally binding contract. Read it carefully, including the commission rate and the length of the exclusive period.",
      "The agent appraises your property and recommends a pricing strategy.",
      "Property is prepared, photographed, and listed. The agent manages this process.",
      "The agent conducts open homes and private inspections and manages all buyer enquiries on your behalf.",
      "Offers are received and negotiated privately. You see outcomes, not the full process. You do not know what other buyers have offered.",
      "You accept or decline an offer. If accepted, contracts are exchanged.",
      "Your settlement agent or conveyancer handles the legal contract and settlement.",
    ],
    sellerControls: "Final acceptance or rejection of any offer",
    othersControl:
      "Pricing strategy, buyer communication, negotiation approach, marketing execution",
    timeCommitment: "Low",
    typicalCost:
      "Agent commission of 2% to 3% of the sale price. On a $750,000 property this is $15,000 to $22,500. Marketing costs may be additional.",
  },
  {
    name: "Auction",
    steps: [
      "Appoint an agent who conducts auctions. Not all agents do. Ask for their auction clearance rate specifically.",
      "Set a reserve price with your agent. This is confidential and is the minimum you will accept.",
      "A marketing campaign runs, typically for four weeks. Open homes and private inspections take place.",
      "On the day, registered buyers compete publicly. Offers are visible to everyone present.",
      "If the offers reach your reserve, the highest offer wins. Contracts are signed on the day. There is no cooling-off period.",
      "If the offers do not reach your reserve, you can negotiate with the highest buyer after the auction.",
      "Settlement follows in the agreed timeframe.",
    ],
    sellerControls: "Reserve price and the decision to sell or pass in",
    othersControl:
      "Campaign strategy, buyer qualification, auction conduct, atmosphere on the day",
    timeCommitment: "Low to moderate",
    typicalCost:
      "Agent commission plus auctioneer fees. Marketing costs are typically non-refundable regardless of outcome.",
  },
  {
    name: "TrueBid Open Offers",
    badge: "No fees during our launch period",
    steps: [
      "Create your TrueBid account and verify your identity through Stripe Identity.",
      "Prepare your listing. Write a description, upload photos, set a price guide, and choose your Open Offer window.",
      "Your listing goes live. Buyers can browse and register interest without an account. To submit an offer, buyers must verify their identity first.",
      "The Open Offer period opens. Every registered buyer can see every offer submitted in real time, including the amount and the time it was placed.",
      "Anti-snipe protection automatically extends the offer window if a new offer is placed close to the closing time. This gives all buyers a fair opportunity to respond.",
      "You review the offers and accept the one that meets your expectations. You are under no obligation to accept any offer.",
      "You engage a settlement agent or conveyancer to prepare the contract of sale and manage settlement. TrueBid does not prepare contracts.",
      "Settlement follows in the agreed timeframe.",
    ],
    sellerControls:
      "Everything except the offers themselves. Pricing, window length, acceptance decision, timing.",
    othersControl: "Nothing. TrueBid provides the platform. You run the sale.",
    timeCommitment:
      "Moderate. You manage enquiries, inspections, and communications directly.",
    typicalCost:
      "TrueBid listing fee only. No agent commission. No fees during our launch period.",
  },
];

function PathwayColumn({ pathway }: { pathway: Pathway }) {
  const isTrueBid = pathway.name === "TrueBid Open Offers";

  return (
    <div
      style={{
        background: "#ffffff",
        border: isTrueBid ? "2px solid #f59e0b" : "1px solid #e5e2db",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          background: isTrueBid ? "#0f1623" : "#f7f5f0",
          padding: "20px 24px",
          borderBottom: "1px solid #e5e2db",
        }}
      >
        <h3
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 20,
            fontWeight: 400,
            color: isTrueBid ? "#ffffff" : "#0f1623",
            marginBottom: pathway.badge ? 8 : 0,
            lineHeight: 1.3,
          }}
        >
          {pathway.name}
        </h3>
        {pathway.badge && (
          <span
            style={{
              display: "inline-block",
              background: "#f59e0b",
              color: "#1a0f00",
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: SYS,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {pathway.badge}
          </span>
        )}
      </div>

      {/* Steps */}
      <div style={{ padding: "24px", flex: 1 }}>
        <p
          style={{
            fontFamily: SYS,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: 14,
          }}
        >
          The process
        </p>
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {pathway.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isTrueBid ? "#f59e0b" : "#e5e2db",
                  color: isTrueBid ? "#1a0f00" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SYS,
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <p
                style={{
                  fontFamily: SYS,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Summary table */}
      <div
        style={{
          borderTop: "1px solid #e5e2db",
          padding: "20px 24px",
          background: "#f7f5f0",
        }}
      >
        <SummaryRow label="Seller controls" value={pathway.sellerControls} />
        <SummaryRow label="Others control" value={pathway.othersControl} />
        <SummaryRow
          label="Seller time commitment"
          value={pathway.timeCommitment}
        />
        <SummaryRow
          label="Typical cost"
          value={pathway.typicalCost}
          highlight={isTrueBid}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginBottom: 12,
      }}
    >
      <p
        style={{
          fontFamily: SYS,
          fontSize: 11,
          fontWeight: 600,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: SYS,
          fontSize: 13,
          color: highlight ? "#0f1623" : "#374151",
          fontWeight: highlight ? 600 : 400,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {value}
      </p>
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
              fontFamily: "Georgia, 'Times New Roman', serif",
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
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            TrueBid gives you the tools to sell your home yourself, free during our current launch period, which will end with no less than 30 days written notice to registered users.
            No agent commissions. No hidden fees. Just transparent, fair property
            transactions between real people.
          </p>
        </div>
      </div>

      {/* Seller / Buyer toggle + steps */}
      <HowItWorksToggle />

      <div className="border-t border-border" />

      {/* Understanding Your Options */}
      <section className="py-16 px-6">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            className="text-navy text-center mb-3"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Understanding Your Options
          </h2>
          <p className="text-text-muted text-center text-sm mb-6">
            Three ways to sell your property in Australia, laid out so you can see how Open Offers compares to a private sale via agent and a traditional auction.
          </p>

          {/* Legal disclaimer */}
          <div className="bg-amber/5 border border-amber/20 rounded-lg px-6 py-5 mb-8 text-sm text-navy leading-relaxed" style={{ maxWidth: 760, margin: "0 auto 32px" }}>
            Live Offers is a transparent offer process, not an auction. Buyers can submit offers during the offer period, and the seller may choose to make previous offer amounts visible to help all buyers make informed decisions. No offer submitted through Live Offers creates a legally binding contract. The seller is not obligated to proceed with any offer. All final negotiations and contracts happen separately, off this platform.
          </div>

          {/* Pathway columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
              alignItems: "start",
            }}
          >
            {PATHWAYS.map((pathway) => (
              <PathwayColumn key={pathway.name} pathway={pathway} />
            ))}
          </div>

          {/* Still weighing it up? */}
          <div style={{ marginTop: 48 }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e2db",
                borderRadius: 12,
                padding: "40px 48px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  color: "#0f1623",
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Still weighing it up?
              </h3>
              <p
                style={{
                  fontFamily: SYS,
                  fontSize: 15,
                  color: "#374151",
                  lineHeight: 1.7,
                  maxWidth: 680,
                  marginBottom: 28,
                }}
              >
                Two guides that might help. &ldquo;What a real estate agent does, and when it is worth the commission&rdquo; walks through the specific situations where a good agent genuinely earns their commission. &ldquo;What is actually involved in selling your own home&rdquo; breaks the process down step by step so you know exactly what you are taking on before you decide.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link
                  href="/guides/what-an-agent-does-and-when-its-worth-it"
                  style={{
                    display: "inline-block",
                    background: "#0f1623",
                    color: "#ffffff",
                    fontFamily: SYS,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: 8,
                  }}
                >
                  What a real estate agent does, and when it is worth the commission
                </Link>
                <Link
                  href="/guides/selling-your-own-home"
                  style={{
                    display: "inline-block",
                    background: "transparent",
                    color: "#0f1623",
                    fontFamily: SYS,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "1px solid #e5e2db",
                  }}
                >
                  What is actually involved in selling your own home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Not sure if TrueBid is right for your sale? */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            style={{
              background: "#f7f5f0",
              border: "1px solid #e5e2db",
              borderLeft: "4px solid #f59e0b",
              borderRadius: 12,
              padding: "36px 40px",
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 24,
                fontWeight: 400,
                color: "#0f1623",
                marginBottom: 16,
                letterSpacing: "-0.01em",
              }}
            >
              Not sure if TrueBid is right for your sale?
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              TrueBid works best for standard residential property sales where
              the seller wants transparency, control, and a lower cost. That is
              not every situation, and we would rather be honest about that than
              pretend otherwise.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              If your property is highly unique, you are managing a complex
              legal situation, or you genuinely cannot find the time to manage
              the sale yourself, appointing an agent may make more sense for
              your circumstances.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                color: "#374151",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Before you make that call, it is worth reading our guide on what
              selling your own home actually involves. Most sellers find the
              process more manageable than they expected. Some still decide to
              appoint an agent afterwards. Either outcome is the right one if it
              is made with a clear picture of what is involved and what each
              option costs.
            </p>
            <a
              href="/guides/selling-your-own-home"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f1623",
                textDecoration: "underline",
              }}
            >
              Read the guide: What is actually involved in selling your own home
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-navy text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
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
              List Your Home Free During Launch
            </Link>
            <Link
              href="/listings"
              className="inline-block text-white font-medium text-sm px-8 py-4 rounded-[10px] hover:bg-white/10 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              Browse Properties
            </Link>
          </div>
          <p
            className="text-center mt-10"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          >
            Identity verified buyers and sellers · Real-time transparent offers ·
            No commissions on transactions · Australian owned and operated
          </p>
        </div>
      </section>
    </div>
  );
}
