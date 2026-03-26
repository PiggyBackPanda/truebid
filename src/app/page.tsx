export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-12">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#e8a838",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f1a2e",
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 20,
              color: "#0f1a2e",
              letterSpacing: "-0.02em",
            }}
          >
            TrueBid
          </span>
        </div>

        <h1
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 56,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            fontWeight: 400,
            color: "#0f1a2e",
          }}
          className="mb-6"
        >
          Property sales.
          <br />
          Transparent. Free.
        </h1>

        <p className="text-lg text-text-muted max-w-xl mx-auto mb-10">
          Sellers list for free. Buyers bid openly. No agent commissions.
          No middleman. Just honest property sales.
        </p>

        <div className="flex gap-4 justify-center">
          <a
            href="/listings"
            style={{
              background: "#e8a838",
              color: "#0f1a2e",
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(232, 168, 56, 0.3)",
              textDecoration: "none",
            }}
          >
            Browse Listings
          </a>
          <a
            href="/register"
            style={{
              background: "#0f1a2e",
              color: "#ffffff",
              fontWeight: 500,
              padding: "12px 24px",
              borderRadius: 10,
              textDecoration: "none",
            }}
          >
            List Your Property
          </a>
        </div>
      </div>
    </main>
  );
}
