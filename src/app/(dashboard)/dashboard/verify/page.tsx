import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeDecrypt } from "@/lib/encryption";
import { formatDate } from "@/lib/utils";
import { VerifyClient } from "./VerifyClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Identity — TrueBid",
};

const STATUS_CONFIG = {
  UNVERIFIED: {
    label: "Not verified",
    colour: "#6b7280",
    bg: "#f3f4f6",
    icon: "○",
  },
  PENDING: {
    label: "Verification in progress",
    colour: "#d97706",
    bg: "#fef3c7",
    icon: "◌",
  },
  VERIFIED: {
    label: "Identity verified",
    colour: "#15803d",
    bg: "#dcfce7",
    icon: "✓",
  },
  REQUIRES_REVIEW: {
    label: "Under review",
    colour: "#7c3aed",
    bg: "#ede9fe",
    icon: "⧖",
  },
  FAILED: {
    label: "Verification failed",
    colour: "#dc2626",
    bg: "#fee2e2",
    icon: "✗",
  },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/verify");

  const userId = (session.user as unknown as Record<string, unknown>).id as string;
  const { reason } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      verificationStatus: true,
      verifiedAt: true,
      verifiedName: true,
    },
  });

  if (!user) redirect("/login");

  const status = user.verificationStatus;
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.UNVERIFIED;
  const verifiedName = safeDecrypt(user.verifiedName);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 28 }}>
        <Link
          href="/dashboard/buyer"
          style={{
            fontSize: 13,
            color: "#6b7280",
            fontFamily: "Outfit, sans-serif",
            textDecoration: "none",
          }}
        >
          ← Dashboard
        </Link>
      </div>

      <h1
        style={{
          fontFamily: "DM Serif Display, Georgia, serif",
          fontSize: 26,
          color: "#0f1a2e",
          marginBottom: 6,
        }}
      >
        Identity Verification
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          fontFamily: "Outfit, sans-serif",
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        TrueBid requires identity verification before you can place offers or
        publish listings. Verification is quick and powered by Stripe Identity.
      </p>

      {/* Reason banner */}
      {reason === "offer" && status !== "VERIFIED" && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
            fontFamily: "Outfit, sans-serif",
            color: "#92400e",
          }}
        >
          You need to verify your identity before placing an offer.
        </div>
      )}
      {reason === "listing" && status !== "VERIFIED" && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
            fontFamily: "Outfit, sans-serif",
            color: "#92400e",
          }}
        >
          You need to verify your identity before publishing a listing.
        </div>
      )}

      {/* Status card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 24,
        }}
      >
        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: config.bg,
            color: config.colour,
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Outfit, sans-serif",
            marginBottom: 20,
          }}
        >
          <span>{config.icon}</span>
          {config.label}
        </div>

        {/* Per-status content */}
        {(status === "UNVERIFIED" || status === "FAILED") && (
          <div>
            <p
              style={{
                fontSize: 14,
                color: "#374151",
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.65,
                marginBottom: 20,
              }}
            >
              {status === "FAILED"
                ? "Your previous verification attempt was unsuccessful. Please try again — you may need to use a different document or improve lighting conditions."
                : "To place offers or list your property, you need to verify your identity. The process takes about 2 minutes and requires a government-issued photo ID."}
            </p>
            <VerifyClient status={status} />
          </div>
        )}

        {status === "PENDING" && (
          <div>
            <p
              style={{
                fontSize: 14,
                color: "#374151",
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.65,
                marginBottom: 12,
              }}
            >
              Your verification is being processed. This usually takes a few
              seconds, but can occasionally take a few minutes.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Refresh this page to check for updates. You will also receive an
              email once the result is available.
            </p>
          </div>
        )}

        {status === "VERIFIED" && (
          <div>
            {verifiedName && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    fontFamily: "Outfit, sans-serif",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Verified name
                </p>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#0f1a2e",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {verifiedName}
                </p>
              </div>
            )}
            {user.verifiedAt && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    fontFamily: "Outfit, sans-serif",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Verified on
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {formatDate(user.verifiedAt)}
                </p>
              </div>
            )}
            <p
              style={{
                marginTop: 20,
                fontSize: 13,
                color: "#6b7280",
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.6,
              }}
            >
              Your identity has been verified. You can now place offers and list
              properties on TrueBid.
            </p>
          </div>
        )}

        {status === "REQUIRES_REVIEW" && (
          <div>
            <p
              style={{
                fontSize: 14,
                color: "#374151",
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.65,
                marginBottom: 12,
              }}
            >
              Your verification requires a manual review by our team. This
              typically completes within 1–2 business days.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              You will be notified by email once the review is complete. If you
              have questions, contact{" "}
              <a href="mailto:support@truebid.com.au" style={{ color: "#0f1a2e" }}>
                support@truebid.com.au
              </a>
              .
            </p>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div
        style={{
          background: "#f9f8f5",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            fontFamily: "Outfit, sans-serif",
            lineHeight: 1.7,
          }}
        >
          TrueBid uses{" "}
          <a
            href="https://stripe.com/identity"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0f1a2e" }}
          >
            Stripe Identity
          </a>{" "}
          for verification. We do <strong>not</strong> store copies of your
          identity documents. Only your verification status and verified name
          are retained, encrypted at rest.{" "}
          <Link href="/privacy" style={{ color: "#0f1a2e" }}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
