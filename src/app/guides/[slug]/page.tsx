import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuideBySlug, getGuidesByCategory, getAllGuides, CATEGORIES } from "@/lib/guides";
import { MarkdownRenderer } from "@/components/guides/MarkdownRenderer";

const SYS = "var(--font-sans)";

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.summary,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const categoryLabel = CATEGORIES[guide.category] ?? guide.category;
  const related = getGuidesByCategory(guide.category).filter(
    (g) => g.slug !== guide.slug
  );

  return (
    <div style={{ background: "#f7f5f0", minHeight: "100vh" }}>
      {/* Header bar */}
      <div style={{ background: "#0f1623", borderBottom: "1px solid #1b2640" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 24px" }}>
          <Link
            href="/guides"
            style={{
              fontFamily: SYS,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← All guides
          </Link>
        </div>
      </div>

      {/* Guide hero */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e2db" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 36px" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(245,158,11,0.1)",
              color: "#b45309",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 6,
              padding: "3px 10px",
              fontFamily: SYS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {categoryLabel}
          </span>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 34,
              fontWeight: 400,
              color: "#0f1623",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            {guide.title}
          </h1>
          <p
            style={{
              fontFamily: SYS,
              fontSize: 16,
              color: "#6b7280",
              lineHeight: 1.6,
              maxWidth: 560,
              marginBottom: 16,
            }}
          >
            {guide.summary}
          </p>
          <p
            style={{
              fontFamily: SYS,
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            {guide.readTime}
          </p>
        </div>
      </div>

      {/* Guide content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 0" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e2db",
            borderRadius: 12,
            padding: "40px 40px 48px",
          }}
        >
          {guide.content ? (
            <MarkdownRenderer content={guide.content} />
          ) : (
            <p
              style={{
                fontFamily: SYS,
                fontSize: 15,
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              Content coming soon.
            </p>
          )}
        </div>

        {/* Related guides */}
        {related.length > 0 && (
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
              Related guides
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {related.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    border: "1px solid #e5e2db",
                    borderRadius: 10,
                    padding: "16px 20px",
                    textDecoration: "none",
                    gap: 16,
                  }}
                  className="card-hover"
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: SYS,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0f1623",
                        marginBottom: 3,
                      }}
                    >
                      {g.title}
                    </p>
                    <p
                      style={{
                        fontFamily: SYS,
                        fontSize: 13,
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.summary}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: SYS,
                      fontSize: 12,
                      color: "#9ca3af",
                      flexShrink: 0,
                    }}
                  >
                    {g.readTime}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            background: "#0f1623",
            borderRadius: 12,
            padding: "32px 36px",
            marginTop: 48,
            marginBottom: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 20,
                fontWeight: 400,
                color: "#ffffff",
                marginBottom: 6,
              }}
            >
              Ready to list your property?
            </p>
            <p
              style={{
                fontFamily: SYS,
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
              }}
            >
              Get started on TrueBid, currently free to use.
            </p>
          </div>
          <Link
            href="/register"
            style={{
              background: "#f59e0b",
              color: "#1a0f00",
              fontFamily: SYS,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Create a Free Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
