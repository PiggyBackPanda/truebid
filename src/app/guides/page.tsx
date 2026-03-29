import type { Metadata } from "next";
import Link from "next/link";
import { getGuidesGroupedByCategory, CATEGORY_ORDER, CATEGORIES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides | TrueBid",
  description:
    "Practical guides for selling your home privately in Australia, without a real estate agent.",
};

const SYS = "var(--font-sans)";

export default function GuidesPage() {
  const groups = getGuidesGroupedByCategory();

  return (
    <div style={{ background: "#f7f5f0", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "#0f1623", borderBottom: "1px solid #1b2640" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 52px" }}>
          <p
            style={{
              fontFamily: SYS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#f59e0b",
              marginBottom: 12,
            }}
          >
            Resource Centre
          </p>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 40,
              fontWeight: 400,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: 14,
              lineHeight: 1.15,
            }}
          >
            Guides
          </h1>
          <p
            style={{
              fontFamily: SYS,
              fontSize: 17,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            Practical information for selling your home privately. No agent required.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {groups.map(({ category, label, guides }) => (
              <section key={category}>
                {/* Category heading */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: 22,
                      fontWeight: 400,
                      color: "#0f1623",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {label}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: "#e5e2db" }} />
                </div>

                {/* Guide cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                  }}
                >
                  {guides.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/guides/${guide.slug}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        background: "#ffffff",
                        border: "1px solid #e5e2db",
                        borderRadius: 12,
                        padding: "24px",
                        textDecoration: "none",
                        transition: "box-shadow 0.15s, transform 0.15s",
                      }}
                      className="card-hover"
                    >
                      <p
                        style={{
                          fontFamily: SYS,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#f59e0b",
                          marginBottom: 8,
                        }}
                      >
                        {label}
                      </p>
                      <h3
                        style={{
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: 18,
                          fontWeight: 400,
                          color: "#0f1623",
                          marginBottom: 10,
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {guide.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: SYS,
                          fontSize: 14,
                          color: "#6b7280",
                          lineHeight: 1.6,
                          flex: 1,
                          marginBottom: 16,
                        }}
                      >
                        {guide.summary}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: SYS,
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          {guide.readTime}
                        </span>
                        <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                          Read
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Browse all categories (shown even when empty so the structure is visible) */}
        {groups.length === 0 && (
          <div style={{ marginTop: 48 }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 20,
                fontWeight: 400,
                color: "#0f1623",
                marginBottom: 16,
              }}
            >
              Coming soon
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CATEGORY_ORDER.map((cat) => (
                <span
                  key={cat}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e2db",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontFamily: SYS,
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  {CATEGORIES[cat]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "64px 0",
        color: "#6b7280",
        fontFamily: SYS,
      }}
    >
      <p style={{ fontSize: 32, marginBottom: 12 }}>📖</p>
      <p style={{ fontSize: 16, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
        Guides coming soon
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
        We&apos;re putting together practical, no-nonsense guides for private sellers. Check back shortly.
      </p>
    </div>
  );
}
