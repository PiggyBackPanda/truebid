import type { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Seller Dashboard",
  description: "Manage your listings, track offers, and monitor activity.",
};
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as {
    id: string;
    firstName?: string;
    role?: string;
  };

  if (user.role !== "SELLER" && user.role !== "BOTH") {
    redirect("/dashboard");
  }

  const listings = await prisma.listing.findMany({
    where: {
      sellerId: user.id,
      status: { in: ["DRAFT", "ACTIVE", "UNDER_OFFER"] },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      streetAddress: true,
      suburb: true,
      state: true,
      status: true,
      saleMethod: true,
      closingDate: true,
      _count: { select: { offers: { where: { status: "ACTIVE" } } } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { thumbnailUrl: true },
      },
    },
  });

  // If only one listing, go straight to it
  if (listings.length === 1) {
    redirect(`/dashboard/seller/${listings[0].id}`);
  }

  // No listings
  if (listings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 32px" }}>
        <p
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 28,
            color: "#0f1a2e",
            marginBottom: 8,
          }}
        >
          No listings yet
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: 15,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          You haven&apos;t created any listings yet.
        </p>
        <Link
          href="/listings/create"
          style={{
            background: "#e8a838",
            color: "#0f1a2e",
            fontWeight: 600,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 15,
          }}
        >
          Create your first listing →
        </Link>
      </div>
    );
  }

  // Multiple listings — show selector
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 32,
            fontWeight: 400,
            color: "#0f1a2e",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          My Listings
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "Outfit, sans-serif" }}>
          Select a listing to manage it
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {listings.map((listing) => {
          const statusColors: Record<string, { bg: string; color: string }> = {
            ACTIVE: { bg: "#dcfce7", color: "#15803d" },
            DRAFT: { bg: "#f3f4f6", color: "#374151" },
            UNDER_OFFER: { bg: "#dbeafe", color: "#1d4ed8" },
          };
          const statusStyle = statusColors[listing.status] ?? { bg: "#f3f4f6", color: "#374151" };

          return (
            <Link
              key={listing.id}
              href={`/dashboard/seller/${listing.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#ffffff",
                border: "1px solid #e5e2db",
                borderRadius: 12,
                padding: "16px 20px",
                textDecoration: "none",
                transition: "box-shadow 0.2s",
              }}
              className="card-hover"
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 64,
                  height: 48,
                  borderRadius: 8,
                  background: listing.images[0]
                    ? undefined
                    : "linear-gradient(135deg, #0f1a2e, #334766)",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.images[0].thumbnailUrl}
                    alt={listing.streetAddress}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#0f1a2e",
                    fontFamily: "Outfit, sans-serif",
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.streetAddress}
                </p>
                <p style={{ color: "#6b7280", fontSize: 13, fontFamily: "Outfit, sans-serif" }}>
                  {listing.suburb}, {listing.state}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {listing.status.replace("_", " ")}
                </span>
                {listing._count.offers > 0 && (
                  <span
                    style={{
                      background: "#fef9c3",
                      color: "#a16207",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {listing._count.offers} offer{listing._count.offers !== 1 ? "s" : ""}
                  </span>
                )}
                <span style={{ color: "#9ca3af", fontSize: 18 }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link
          href="/listings/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(232,168,56,0.08)",
            color: "#0f1a2e",
            border: "1px solid #e8a838",
            borderRadius: 10,
            padding: "10px 20px",
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + Add another listing
        </Link>
      </div>
    </div>
  );
}
