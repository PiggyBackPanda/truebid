import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — TrueBid",
  description:
    "TrueBid was built to make Australian property sales transparent, fair, and free of agent commissions. Learn our story and values.",
};

export default function AboutPage() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <div className="bg-navy py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#f59e0b",
              marginBottom: 16,
            }}
          >
            What we're here for
          </p>
          <h1
            className="text-white mb-6"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(30px, 5vw, 52px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Property sales in Australia are opaque.
            <br className="hidden sm:block" /> We&rsquo;re changing that.
          </h1>
          <p
            className="text-white/65 max-w-2xl mx-auto"
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            Selling your home is the largest financial transaction most
            Australians will ever make. Yet the process is opaque, stressful,
            and dominated by intermediaries who take a cut without adding
            proportionate value. TrueBid exists to change that.
          </p>
        </div>
      </div>

      {/* Founding story */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-navy mb-6"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Why we built this
          </h2>
          <div
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 16,
              lineHeight: 1.8,
              color: "#4a5568",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <p>
              The idea for TrueBid started with a frustrating experience that
              most Australian home-sellers will recognise: you hand over your
              most valuable asset to an agent, pay tens of thousands of dollars
              in commission, and still have almost no visibility into what&rsquo;s
              happening. Offers arrive filtered through a middleman. You never
              know if there were other buyers. You can&rsquo;t see what a property
              truly traded for until weeks later, if at all.
            </p>
            <p>
              The internet fixed this in every other industry.
              Travel, finance, accommodation — all disintermediated.
              Property was the last holdout, protected by inertia and the fact that
              most people only sell a few times in their lives.
            </p>
            <p>
              So we built TrueBid: a platform where sellers list for free, buyers
              see every offer in real time, and the transaction happens directly
              between the two parties. No agent commission. No information
              asymmetry. No games.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Built in Perth */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#fef3dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#f59e0b"
                />
                <circle cx="12" cy="9" r="2.5" fill="#0f1a2e" />
              </svg>
            </div>
            <div>
              <h2
                className="text-navy mb-2"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(22px, 3vw, 32px)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              >
                Built in Perth, for Australia
              </h2>
              <p
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "#4a5568",
                }}
              >
                TrueBid is an Australian company, built by Australians who have
                navigated the local property market firsthand. We understand the
                nuances of selling in Perth, Sydney, Melbourne, and everywhere in
                between: the different settlement periods, the varying market
                conditions, the regulatory landscape.
              </p>
            </div>
          </div>
          <p
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: "#4a5568",
            }}
          >
            We&rsquo;re not a Silicon Valley company parachuting in with a platform
            built for a different country. Every design decision, every feature,
            every safeguard has been built with Australian property law,
            Australian buyers, and Australian sellers in mind. When you have a
            question, you reach a real person based in Australia.
          </p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Core values */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-navy text-center mb-3"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            What we stand for
          </h2>
          <p
            className="text-center text-text-muted text-sm mb-12"
            style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
          >
            Three principles that shape every decision we make.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                </svg>
              }
              title="Transparency"
              body="Every offer is visible to every buyer in real time. The seller sees full buyer details. The public sees anonymous pseudonyms. Nothing is hidden, nothing is filtered, nothing disappears into a black box."
            />
            <ValueCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <line
                    x1="12"
                    y1="1"
                    x2="12"
                    y2="23"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="No commissions"
              body="Placing offers is always free. During our launch period, listing is also free. We'll give you at least 30 days notice before any listing fee is introduced. The core transaction will never carry a commission."
            />
            <ValueCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Fairness"
              body="Anti-snipe protection stops last-second tactics. Identity verification ensures every participant is who they say they are. Offers can only go up, never down. The rules are the same for everyone."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
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
            Ready to experience a fairer way to sell?
          </h2>
          <p
            className="text-white/60 mb-8"
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Built for Australians who believe property sales should be open,
            fair, and free of hidden costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-amber text-navy font-semibold text-sm px-8 py-4 rounded-[10px] hover:bg-amber-light transition-colors shadow-amber"
            >
              List your home for free →
            </Link>
            <Link
              href="/how-it-works"
              className="inline-block text-white font-medium text-sm px-8 py-4 rounded-[10px] hover:bg-white/10 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              How it works →
            </Link>
          </div>
          <p
            className="text-center mt-10"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Australian owned and operated · No commissions on transactions · Identity
            verified participants · Real-time transparent offers
          </p>
        </div>
      </section>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="bg-white border border-border rounded-xl p-7"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
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
      <h3
        className="text-navy"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        className="text-text-muted leading-relaxed"
        style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14 }}
      >
        {body}
      </p>
    </div>
  );
}
