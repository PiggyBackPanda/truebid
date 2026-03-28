import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#0f1a2e", borderTop: "1px solid #1a2a45" }}>
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
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#e8a838",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "DM Serif Display, Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f1a2e",
                  flexShrink: 0,
                }}
              >
                T
              </div>
              <span
                style={{
                  fontFamily: "DM Serif Display, Georgia, serif",
                  fontSize: 18,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                }}
              >
                TrueBid
              </span>
            </Link>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: "Outfit, sans-serif",
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
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Platform
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink href="/listings">Browse Listings</FooterLink>
              <FooterLink href="/how-it-works">How It Works</FooterLink>
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
                fontFamily: "Outfit, sans-serif",
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
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink href="mailto:hello@truebid.com.au">hello@truebid.com.au</FooterLink>
              <FooterLink href="mailto:privacy@truebid.com.au">privacy@truebid.com.au</FooterLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #1a2a45",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            &copy; {year} TrueBid Pty Ltd &middot; Australian owned and operated
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Launching in Western Australia · 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("mailto:");
  if (isExternal) {
    return (
      <a
        href={href}
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          textDecoration: "none",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        textDecoration: "none",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {children}
    </Link>
  );
}
