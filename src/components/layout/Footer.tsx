import Link from "next/link";
import { Logo } from "@/components/Logo";

const SYS = "var(--font-sans)";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#0f1623", borderTop: "1px solid #1b2640" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px 32px",
        }}
      >
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div style={{ marginBottom: 16 }}>
              <Logo variant="light" linked className="text-lg" />
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: SYS,
                maxWidth: 220,
              }}
            >
              Free, transparent property sales for Australia. No agent commissions.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: SYS,
              }}
            >
              Platform
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink href="/listings">Browse Listings</FooterLink>
              <FooterLink href="/how-it-works">How It Works</FooterLink>
              <FooterLink href="/guides">Guides</FooterLink>
              <FooterLink href="/register">List Your Property</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: SYS,
              }}
            >
              Legal
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: SYS,
              }}
            >
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink href="/contact">Contact us</FooterLink>
              <FooterLink href="mailto:hello@truebid.com.au">hello@truebid.com.au</FooterLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #1b2640",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: SYS }}>
            &copy; {year} TrueBid Pty Ltd &middot; Australian owned and operated
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: SYS }}>
            Launching in Western Australia · 2026
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: SYS, width: "100%" }}>
            TrueBid is a technology platform, not a licensed real estate agency. We do not act as an agent for buyers or sellers.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("mailto:");
  const style = {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textDecoration: "none",
    fontFamily: SYS,
  };
  if (isExternal) {
    return <a href={href} style={style}>{children}</a>;
  }
  return <Link href={href} style={style}>{children}</Link>;
}
