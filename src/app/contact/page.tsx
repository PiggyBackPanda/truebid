import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | TrueBid",
  description:
    "Get in touch with the TrueBid team. We're based in Perth, Australia and aim to respond within two business days.",
};

export default function ContactPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="bg-navy py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-white mb-3"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Get in touch
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 16,
              lineHeight: 1.5,
            }}
          >
            We&apos;re based in Perth, Australia and aim to respond within two business days.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        {/* Primary contact card */}
        <div className="bg-white border border-border rounded-xl p-8 mb-6">
          <div className="flex items-start gap-5">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#fef3dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-navy mb-1"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Email us
              </h2>
              <p className="text-text-muted text-sm mb-3" style={{ lineHeight: 1.6 }}>
                For questions about listings, your account, or how the platform works.
              </p>
              <a
                href="mailto:hello@truebid.com.au"
                className="text-navy font-semibold text-sm hover:underline"
              >
                hello@truebid.com.au
              </a>
            </div>
          </div>
        </div>

        {/* Response time note */}
        <div className="bg-white border border-border rounded-xl p-8 mb-6">
          <div className="flex items-start gap-5">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#fef3dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                <polyline
                  points="12,6 12,12 16,14"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-navy mb-1"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Response times
              </h2>
              <p className="text-text-muted text-sm" style={{ lineHeight: 1.6 }}>
                We aim to respond to all enquiries within two business days. For urgent
                legal or settlement matters, contact your conveyancer or solicitor directly.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ nudge */}
        <div className="bg-white border border-border rounded-xl p-8">
          <div className="flex items-start gap-5">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#fef3dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                <path
                  d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2
                className="text-navy mb-1"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Looking for a quick answer?
              </h2>
              <p className="text-text-muted text-sm mb-4" style={{ lineHeight: 1.6 }}>
                Our FAQ covers most common questions about listing, offers, conveyancing, and the Live Offers process.
              </p>
              <Link
                href="/faq"
                className="inline-block bg-navy text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-navy-light transition-colors"
              >
                Browse the FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
