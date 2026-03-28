"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "#ffffff",
  border: "1px solid #e5e2db",
  borderRadius: 16,
  padding: "40px",
  boxShadow: "0 1px 3px rgba(15,22,35,0.06)",
  textAlign: "center",
};

const iconCircle = (bg: string, content: string) => (
  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      margin: "0 auto 20px",
    }}
  >
    {content}
  </div>
);

const cardHeading: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 26,
  color: "#0f1623",
  marginBottom: 10,
  letterSpacing: "-0.02em",
};

const cardBody: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 14,
  marginBottom: 8,
  lineHeight: 1.6,
};

const primaryLink: React.CSSProperties = {
  display: "inline-block",
  background: "#f59e0b",
  color: "#1a0f00",
  fontWeight: 600,
  fontSize: 14,
  padding: "12px 28px",
  borderRadius: 10,
  textDecoration: "none",
};

const secondaryLink: React.CSSProperties = {
  display: "inline-block",
  background: "#0f1623",
  color: "#ffffff",
  fontWeight: 500,
  fontSize: 14,
  padding: "12px 28px",
  borderRadius: 10,
  textDecoration: "none",
};

// ── Dev bypass block ──────────────────────────────────────────────────────────

function DevBypassBlock({
  onBypass,
  busy,
  error,
}: {
  onBypass: () => void;
  busy: boolean;
  error: string;
}) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: "16px",
        background: "#1a1a2e",
        borderRadius: 10,
        border: "1px dashed #6366f1",
        textAlign: "left",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#a5b4fc",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        Development only
      </p>
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{error}</p>
      )}
      <button
        type="button"
        onClick={onBypass}
        disabled={busy}
        style={{
          width: "100%",
          padding: "10px",
          background: busy ? "#374151" : "#4f46e5",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {busy ? "Setting verified…" : "Dev: Mark as Verified"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function VerifyIdentityContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const user = session?.user as Record<string, unknown> | undefined;
  const verificationStatus = user?.verificationStatus as string | undefined;

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [devBypassing, setDevBypassing] = useState(false);
  const [devError, setDevError] = useState("");

  const isDev = process.env.NODE_ENV === "development";

  async function handleStartVerification() {
    setStarting(true);
    setStartError("");
    try {
      const res = await fetch("/api/verification/start", { method: "POST" });
      const data = await res.json() as { clientSecret?: string; error?: string };

      if (!res.ok || !data.clientSecret) {
        setStartError(data.error ?? "Could not start verification. Please try again.");
        setStarting(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setStartError("Stripe failed to load. Please refresh and try again.");
        setStarting(false);
        return;
      }

      const { error: stripeError } = await stripe.verifyIdentity(data.clientSecret);

      if (stripeError) {
        if (stripeError.code !== "session_cancelled") {
          setStartError(stripeError.message ?? "Verification could not be completed.");
        }
      } else {
        // Full reload so the session picks up the new verificationStatus
        window.location.reload();
      }
    } catch {
      setStartError("Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  async function handleDevBypass() {
    setDevBypassing(true);
    setDevError("");
    try {
      const res = await fetch("/api/verify-identity/dev-bypass", { method: "POST" });
      if (res.ok) {
        window.location.href = returnTo;
      } else {
        const data = await res.json() as { error?: string };
        setDevError(data.error ?? "Dev bypass failed.");
      }
    } catch {
      setDevError("Dev bypass failed.");
    } finally {
      setDevBypassing(false);
    }
  }

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.replace(`/login?callbackUrl=/verify-identity`);
    return null;
  }

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #f59e0b",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  // ── Already verified ─────────────────────────────────────────────────────────

  if (verificationStatus === "VERIFIED") {
    return (
      <div style={cardStyle}>
        {iconCircle("#dcfce7", "✓")}
        <h1 style={cardHeading}>You&apos;re already verified</h1>
        <p style={{ ...cardBody, marginBottom: 28 }}>
          Your identity has been verified. You can list properties and place offers on TrueBid.
        </p>
        <Link href={returnTo} style={primaryLink}>Continue →</Link>
      </div>
    );
  }

  // ── Verification failed (terminal Stripe error) ───────────────────────────

  if (verificationStatus === "FAILED") {
    return (
      <div style={cardStyle}>
        {iconCircle("#fee2e2", "✕")}
        <h1 style={cardHeading}>Verification failed</h1>
        <p style={cardBody}>
          We weren&apos;t able to verify your identity. This may have been due to document quality, a consent issue, or an unsupported document type.
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
          Please try again, or contact{" "}
          <a href="mailto:support@truebid.com.au" style={{ color: "#b45309" }}>
            support@truebid.com.au
          </a>{" "}
          if you believe this is an error.
        </p>
        {startError && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              color: "#dc2626",
              fontSize: 13,
              textAlign: "left",
            }}
          >
            {startError}
          </div>
        )}
        <Button size="lg" onClick={handleStartVerification} loading={starting} className="w-full">
          Try again →
        </Button>
        {isDev && (
          <DevBypassBlock onBypass={handleDevBypass} busy={devBypassing} error={devError} />
        )}
      </div>
    );
  }

  // ── PENDING / REQUIRES_REVIEW — Stripe is processing ────────────────────────

  if (verificationStatus === "PENDING" || verificationStatus === "REQUIRES_REVIEW") {
    return (
      <div style={cardStyle}>
        {iconCircle("#fef9c3", "⏳")}
        <h1 style={cardHeading}>Verification in progress</h1>
        <p style={cardBody}>
          Stripe Identity is processing your documents. This usually takes just a few minutes.
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
          We&apos;ll email you at{" "}
          <strong style={{ color: "#0f1623" }}>{user?.email as string}</strong>{" "}
          once it&apos;s complete.
        </p>
        <Link href="/dashboard" style={secondaryLink}>Go to dashboard</Link>
        {isDev && (
          <DevBypassBlock onBypass={handleDevBypass} busy={devBypassing} error={devError} />
        )}
      </div>
    );
  }

  // ── Default: explanation screen ───────────────────────────────────────────────

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 16,
        padding: "40px",
        boxShadow: "0 1px 3px rgba(15,22,35,0.06), 0 4px 12px rgba(15,22,35,0.04)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f1623",
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 20,
              color: "#0f1623",
              letterSpacing: "-0.02em",
            }}
          >
            TrueBid
          </span>
        </Link>
      </div>

      {/* Shield icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#fffbeb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          margin: "0 auto 20px",
        }}
      >
        🛡️
      </div>

      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 28,
          fontWeight: 400,
          color: "#0f1623",
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        Verify your identity
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 14,
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        TrueBid requires identity verification before you can list a property or
        place an offer. This keeps our platform trustworthy for everyone.
      </p>

      {/* What you'll need */}
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          What you&apos;ll need
        </p>
        {[
          { icon: "🪪", title: "Australian Driver's Licence", desc: "Front side only" },
          { icon: "🛂", title: "Australian Passport", desc: "Photo page" },
          { icon: "🤳", title: "A short selfie video or photo", desc: "Taken live in your camera" },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f1623",
                  marginBottom: 2,
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stripe Identity info */}
      <div
        style={{
          background: "#f5f3ff",
          border: "1px solid #ddd6fe",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 28,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <div>
          <p style={{ fontSize: 13, color: "#4c1d95", lineHeight: 1.6, marginBottom: 4 }}>
            <strong>Powered by Stripe Identity</strong> — Verification is automated and typically
            takes less than 2 minutes. Your documents are encrypted and never stored on
            TrueBid&apos;s servers.
          </p>
          <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, letterSpacing: "0.02em" }}>
            stripe
          </p>
        </div>
      </div>

      {startError && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          {startError}
        </div>
      )}

      <Button size="lg" onClick={handleStartVerification} loading={starting} className="w-full">
        Start Verification →
      </Button>

      <p style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 12 }}>
        You&apos;ll be guided through the steps by Stripe&apos;s secure verification flow.
      </p>

      <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
        Already verified?{" "}
        <Link href="/dashboard" style={{ color: "#b45309", textDecoration: "none" }}>
          Go to dashboard
        </Link>
      </p>

      {isDev && (
        <DevBypassBlock onBypass={handleDevBypass} busy={devBypassing} error={devError} />
      )}
    </div>
  );
}

export default function VerifyIdentityPage() {
  return (
    <Suspense>
      <VerifyIdentityContent />
    </Suspense>
  );
}
