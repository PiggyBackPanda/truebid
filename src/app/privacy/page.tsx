import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TrueBid",
  description:
    "TrueBid Privacy Policy. Learn how we collect, use, and protect your personal information in accordance with the Australian Privacy Act 1988.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    content: [
      {
        label: "Account information",
        text: "Your name, email address, phone number, and role preference (buyer, seller, or both).",
      },
      {
        label: "Identity verification data",
        text: "We use Stripe Identity to verify your government-issued ID. TrueBid does not store copies of identity documents, document numbers, or dates of birth. We retain only your verification status and verified name (encrypted at rest).",
      },
      {
        label: "Property listing data",
        text: "Address, description, photos, price, and property details you enter when creating a listing.",
      },
      {
        label: "Offer data",
        text: "Offer amounts, conditions, settlement preferences, and any personal notes to sellers.",
      },
      {
        label: "Communication data",
        text: "Messages exchanged between buyers and sellers on the platform.",
      },
      {
        label: "Usage data",
        text: "Pages visited, listings viewed, search queries, device information, and IP address (hashed for analytics).",
      },
      {
        label: "Location data",
        text: "Approximate location inferred from IP address, used for search relevance.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    items: [
      "To provide the TrueBid platform and its features",
      "To verify your identity and prevent fraud",
      "To facilitate communication between buyers and sellers",
      "To send notifications about offers, messages, and listing updates",
      "To improve the platform based on usage patterns (anonymised and aggregated)",
      "To connect you with referral partners when you explicitly request it",
    ],
  },
  {
    title: "Who We Share Your Information With",
    content: [
      {
        label: "Other TrueBid users",
        text: "Sellers see buyer names, email, and phone number when an offer is placed. Buyers see seller first names only. The public sees only pseudonymous aliases on the offer board.",
      },
      {
        label: "Identity verification provider",
        text: "Stripe Identity processes your ID document for verification. Stripe's handling of your document is governed by their own privacy policy. TrueBid receives only the verification outcome and your verified name — not the document itself.",
      },
      {
        label: "Service providers",
        text: "Hosting (AWS), email (Resend), and analytics tools — all bound by data processing agreements.",
      },
      {
        label: "Referral partners",
        text: "Only when you explicitly click a referral link and consent to sharing your contact details.",
      },
      {
        label: "Law enforcement",
        text: "If required by law, court order, or to protect the rights and safety of our users.",
      },
    ],
  },
  {
    title: "Data Storage and Security",
    items: [
      "All data is stored in Australia (AWS Sydney region, ap-southeast-2).",
      "We use encryption in transit (TLS 1.2+) and encryption at rest.",
      "Verified names are encrypted at the application level (AES-256-GCM) before being stored in the database.",
      "TrueBid does not store copies of identity documents, document numbers, or dates of birth.",
      "Access to personal data is restricted to authorised TrueBid personnel.",
      "We retain account data for 7 years after account deletion for legal and audit purposes.",
      "Identity verification status and verified name are retained for fraud prevention. You may request deletion by contacting support@truebid.com.au.",
      "We do not sell your personal data to third parties.",
    ],
  },
  {
    title: "Your Rights",
    intro:
      "Under the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs), you have the right to:",
    items: [
      "Access the personal information we hold about you",
      "Request correction of inaccurate or incomplete information",
      "Request deletion of your account and associated personal data (subject to legal retention requirements)",
      "Request deletion of your identity verification data by contacting support@truebid.com.au",
      "Opt out of marketing communications at any time",
      "Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au",
    ],
  },
  {
    title: "Cookies",
    items: [
      "Essential cookies: used for authentication and session management. These are required for the platform to function.",
      "Analytics cookies: anonymised data to understand how people use the platform. No personally identifiable information is collected.",
      "We do not use advertising cookies and do not sell data to advertisers.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <div className="bg-navy py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontFamily: "Outfit, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Legal
          </p>
          <h1
            className="text-white"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontFamily: "Outfit, sans-serif",
              marginTop: 10,
            }}
          >
            Last updated: March 2026
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Legal notice */}
        <div
          className="rounded-lg p-5 mb-10"
          style={{
            background: "rgba(232,168,56,0.07)",
            border: "1px solid rgba(232,168,56,0.25)",
          }}
        >
          <p
            className="text-text-muted leading-relaxed"
            style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
          >
            <strong className="text-navy">Important:</strong> This Privacy Policy
            has not yet been reviewed by a qualified privacy practitioner. TrueBid
            is in pre-launch. This policy will be finalised before the platform
            opens to the public.
          </p>
        </div>

        {/* Introduction */}
        <p
          className="text-text-muted leading-relaxed mb-10"
          style={{ fontSize: 15, fontFamily: "Outfit, sans-serif" }}
        >
          TrueBid Pty Ltd is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, and share your personal information
          in accordance with the{" "}
          <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles
          (APPs).
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={i}>
              <h2
                className="text-navy mb-5"
                style={{
                  fontFamily: "DM Serif Display, Georgia, serif",
                  fontSize: 20,
                  fontWeight: 400,
                }}
              >
                {i + 1}. {section.title}
              </h2>

              {"intro" in section && section.intro && (
                <p
                  className="text-text-muted mb-3 leading-relaxed"
                  style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
                >
                  {section.intro}
                </p>
              )}

              {"content" in section && section.content && (
                <div className="space-y-3">
                  {section.content.map((item, j) => (
                    <div key={j} className="flex gap-3">
                      <div
                        className="flex-shrink-0 font-semibold text-navy"
                        style={{
                          fontSize: 13,
                          fontFamily: "Outfit, sans-serif",
                          minWidth: 160,
                          paddingTop: 1,
                        }}
                      >
                        {item.label}
                      </div>
                      <p
                        className="text-text-muted leading-relaxed"
                        style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
                      >
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {"items" in section && section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-2.5">
                      <span
                        className="flex-shrink-0 text-amber mt-1"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span
                        className="text-text-muted leading-relaxed"
                        style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-border mt-8" />
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10">
          <h2
            className="text-navy mb-4"
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 20,
              fontWeight: 400,
            }}
          >
            7. Contact
          </h2>
          <div className="space-y-2">
            <p
              className="text-text-muted leading-relaxed"
              style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
            >
              Privacy enquiries:{" "}
              <a
                href="mailto:privacy@truebid.com.au"
                className="text-navy underline"
              >
                privacy@truebid.com.au
              </a>
            </p>
            <p
              className="text-text-muted leading-relaxed"
              style={{ fontSize: 14, fontFamily: "Outfit, sans-serif" }}
            >
              Office of the Australian Information Commissioner (OAIC):{" "}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy underline"
              >
                www.oaic.gov.au
              </a>
            </p>
          </div>
        </div>

        {/* Nav links */}
        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
          <Link
            href="/terms"
            className="text-sm text-text-muted hover:text-navy underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm text-text-muted hover:text-navy underline"
          >
            How It Works
          </Link>
          <Link
            href="/faq"
            className="text-sm text-text-muted hover:text-navy underline"
          >
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
