import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    role?: string;
    verificationStatus?: string;
    publicAlias?: string;
  };

  const isVerified = user.verificationStatus === "VERIFIED";
  const isSeller = user.role === "SELLER" || user.role === "BOTH";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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
          Welcome back, {user.firstName}
        </h1>
        <p style={{ color: "#6b7280", fontSize: 15 }}>
          {user.email} · {user.publicAlias}
        </p>
      </div>

      {/* Verification banner */}
      {!isVerified && (
        <div
          style={{
            background: "#fff3e0",
            border: "1px solid #ffcc80",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: "#e65100", fontSize: 14, marginBottom: 2 }}>
              Identity verification required
            </p>
            <p style={{ color: "#6b7280", fontSize: 13 }}>
              You need to verify your identity before you can place offers or list a property.
            </p>
          </div>
          <Link
            href="/verify-identity"
            style={{
              background: "#e8a838",
              color: "#0f1a2e",
              fontWeight: 600,
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Verify now
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <DashboardCard
          title="Browse listings"
          description="Find properties with open offers in your area."
          href="/listings"
          icon="🏡"
        />
        {isSeller && (
          <DashboardCard
            title="List a property"
            description="Create a free listing and start receiving offers."
            href="/listings/create"
            icon="+"
            highlight
          />
        )}
        <DashboardCard
          title="My offers"
          description="Track all your active and past offers."
          href="/dashboard/buyer"
          icon="📋"
        />
        {isSeller && (
          <DashboardCard
            title="My listings"
            description="Manage your active listings and review offers."
            href="/dashboard/seller"
            icon="📊"
          />
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon,
  highlight = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: highlight ? "rgba(232,168,56,0.06)" : "#ffffff",
        border: `1px solid ${highlight ? "#e8a838" : "#e5e2db"}`,
        borderRadius: 12,
        padding: "24px",
        textDecoration: "none",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      className="card-hover"
    >
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <p
        style={{
          fontWeight: 600,
          color: "#0f1a2e",
          fontSize: 15,
          marginBottom: 6,
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {title}
      </p>
      <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5, fontFamily: "Outfit, sans-serif" }}>
        {description}
      </p>
    </Link>
  );
}
