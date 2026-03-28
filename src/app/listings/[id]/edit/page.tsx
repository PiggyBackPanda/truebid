import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  COMING_SOON: "Coming Soon",
  ACTIVE: "Active",
  UNDER_OFFER: "Under Offer",
};

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; role?: string };
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      streetAddress: true,
      suburb: true,
      state: true,
      status: true,
    },
  });

  if (!listing || listing.sellerId !== user.id) {
    notFound();
  }

  const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;
  const statusLabel = STATUS_LABELS[listing.status] ?? listing.status;

  const steps = [
    {
      step: 1,
      title: "Property Details",
      description: "Address, property type, rooms, description, features, and additional information.",
      href: `/listings/create/details?id=${id}`,
    },
    {
      step: 2,
      title: "Photos",
      description: "Upload, reorder, or remove photos and floor plans.",
      href: `/listings/create/photos?id=${id}`,
    },
    {
      step: 3,
      title: "Sale Method",
      description: "Sale method, pricing, closing date, inspection requirements, and address privacy.",
      href: `/listings/create/method?id=${id}`,
    },
    {
      step: 4,
      title: "Review & Publish",
      description: "Preview your listing and publish it or change its status.",
      href: `/listings/create/review?id=${id}`,
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Back link */}
      <Link
        href={`/dashboard/seller/${id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          color: "#6b7280",
          textDecoration: "none",
          marginBottom: 24,
          fontFamily: "var(--font-sans)",
        }}
      >
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#0f1623",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Edit Listing
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {address}
          <span
            style={{
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {statusLabel}
          </span>
        </p>
      </div>

      {/* Step cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map(({ step, title, description, href }) => (
          <Link
            key={step}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#ffffff",
              border: "1px solid #e5e2db",
              borderRadius: 12,
              padding: "20px 24px",
              textDecoration: "none",
              transition: "box-shadow 0.15s",
            }}
            className="card-hover"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#f59e0b",
                color: "#0f1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
                fontFamily: "var(--font-sans)",
              }}
            >
              {step}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#0f1623",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 3,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            </div>
            <span style={{ color: "#9ca3af", fontSize: 18, flexShrink: 0 }}>→</span>
          </Link>
        ))}
      </div>

      {/* View listing link */}
      <div style={{ marginTop: 24 }}>
        <Link
          href={`/listings/${id}`}
          style={{
            fontSize: 13,
            color: "#6b7280",
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
          }}
        >
          View Listing Page
        </Link>
      </div>
    </div>
  );
}
